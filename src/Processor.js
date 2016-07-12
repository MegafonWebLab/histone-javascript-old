define([
	'Utils', 'Share', 'OrderedMap', 'parser/Constants'
], function(Utils, Share, OrderedMap, AST) {

	function processMap(items, stack, getProp, ret) {
		var result = new OrderedMap();
		Utils.forEachAsync(items, function(item, ret) {
			processNode(item[1], stack, getProp, function(value) {
				result.set(item[0], value);
				ret();
			});
		}, function() { ret(result); });
	}

	function processNot(value, stack, getProp, ret) {
		processNode(value, stack, getProp, function(value) {
			ret(!Share.nodeToBoolean(value));
		});
	}

	function processOr(left, right, stack, getProp, ret) {
		processNode(left, stack, getProp, function(left) {
			if (Share.nodeToBoolean(left)) ret(left);
			else processNode(right, stack, getProp, ret);
		});
	}

	function processAnd(left, right, stack, getProp, ret) {
		processNode(left, stack, getProp, function(left) {
			if (!Share.nodeToBoolean(left)) ret(left);
			else processNode(right, stack, getProp, ret);
		});
	}

	function processEquality(left, right, invert, stack, getProp, ret) {
		processNode(left, stack, getProp, function(left) {
			processNode(right, stack, getProp, function(right) {
				if (Utils.isString(left) && Utils.isNumber(right)) {
					if (!Utils.isNumeric(left)) left = parseFloat(left, 10);
					else right = Share.nodeToString(right);
				} else if (Utils.isNumber(left) && Utils.isString(right)) {
					if (!Utils.isNumeric(right)) right = parseFloat(right, 10);
					else left = Share.nodeToString(left);
				}
				if (!(Utils.isString(left) && Utils.isString(right))) {
					if (Utils.isNumber(left) && Utils.isNumber(right)) {
						left = parseFloat(left);
						right = parseFloat(right);
					} else {
						left = Share.nodeToBoolean(left);
						right = Share.nodeToBoolean(right);
					}
				}
				ret(invert ? left !== right : left === right);
			});
		});
	}

	function processRelational(nodeType, left, right, stack, getProp, ret) {
		processNode(left, stack, getProp, function(left) {
			processNode(right, stack, getProp, function(right) {
				if (Utils.isString(left) && Utils.isNumber(right)) {
					if (Utils.isNumeric(left)) left = parseFloat(left, 10);
					else right = Share.nodeToString(right);
				} else if (Utils.isNumber(left) && Utils.isString(right)) {
					if (Utils.isNumeric(right)) right = parseFloat(right, 10);
					else left = Share.nodeToString(left);
				}
				if (!(Utils.isNumber(left) && Utils.isNumber(right))) {
					if (Utils.isString(left) && Utils.isString(right)) {
						left = left.length;
						right = right.length;
					} else {
						left = Share.nodeToBoolean(left);
						right = Share.nodeToBoolean(right);
					}
				}
				switch (nodeType) {
					case AST.LESS_THAN: ret(left < right); break;
					case AST.GREATER_THAN: ret(left > right); break;
					case AST.LESS_OR_EQUAL: ret(left <= right); break;
					case AST.GREATER_OR_EQUAL: ret(left >= right); break;
				}
			});
		});
	}

	function processArithmetical(nodeType, left, right, stack, getProp, ret) {
		processNode(left, stack, getProp, function(left) {
			if (Utils.isNumeric(left)) left = parseFloat(left, 10);
			if (!Utils.isNumber(left)) return ret();
			if (nodeType === AST.NEGATE) return ret(-left);
			processNode(right, stack, getProp, function(right) {
				if (Utils.isNumeric(right)) right = parseFloat(right, 10);
				if (!Utils.isNumber(right)) return ret();
				switch (nodeType) {
					case AST.SUB: ret(left - right); break;
					case AST.MUL: ret(left * right); break;
					case AST.DIV: ret(left / right); break;
					case AST.MOD: ret(left % right); break;
				}
			});
		});
	}

	function processAddition(left, right, stack, getProp, ret) {
		processNode(left, stack, getProp, function(left) {
			processNode(right, stack, getProp, function(right) {
				if (!(Utils.isString(left) || Utils.isString(right))) {
					if (Utils.isNumber(left) || Utils.isNumber(right)) {
						if (Utils.isNumeric(left)) left = parseFloat(left, 10);
						if (!Utils.isNumber(left)) return ret();
						if (Utils.isNumeric(right)) right = parseFloat(right, 10);
						if (!Utils.isNumber(right)) return ret();
						return ret(left + right);
					}
					else if (left instanceof OrderedMap &&
						right instanceof OrderedMap) {
						var result = left.clone();
						result = result.concat(right);
						return ret(result);
					}
				}
				left = Share.nodeToString(left);
				right = Share.nodeToString(right);
				ret(left + right);
			});
		});
	}

	function processIf(conditions, stack, getProp, ret) {
		var result = '';
		Utils.forEachAsync(conditions, function(condition, ret) {
			processNode(condition[0], stack, getProp, function(condResult) {
				if (!Share.nodeToBoolean(condResult)) return ret();
				stack.save();
				processNodes(condition[1], stack, getProp, function(value) {
					result = value;
					stack.restore();
					ret(true);
				});
			});
		}, function() { ret(result); });
	}

	function processFor(iterator, collection, statements, stack, getProp, ret) {
		processNode(collection, stack, getProp, function(collection) {
			if (collection instanceof OrderedMap && collection.length()) {
				var result = '', self;
				var keys = collection.keys();
				var values = collection.values();
				Utils.forEachAsync(values, function(
					value, ret, key, index, last) {
					stack.save();
					stack.put(iterator[0], value);
					if (iterator[1]) stack.put(iterator[1], keys[index]);
					self = {last: last, index: index};
					stack.put('self', Share.js2internal(self));
					processNodes(statements[0], stack, getProp, function(value) {
						result += value;
						stack.restore();
						ret();
					});
				}, function() { ret(result); });
			} else if (statements[1]) {
				stack.save();
				processNodes(statements[1], stack, getProp, function(result) {
					stack.restore();
					ret(result);
				});
			} else ret('');
		});
	}

	function processTernary(condition, left, right, stack, getProp, ret) {
		processNode(condition, stack, getProp, function(result) {
			result = Share.nodeToBoolean(result);
			if (result = result && left || right)
				processNode(result, stack, getProp, ret);
			else ret();
		});
	}

	function processVar(name, value, stack, getProp, ret) {
		stack.save();
		processNode(value, stack, getProp, function(value) {
			stack.restore();
			stack.put(name, value);
			ret('');
		});
	}

	function processMacro(name, macroArgs, macroBody, stack, getProp, ret) {
		stack.put(name, function(value, args, ret) {
			stack.save();
			stack.put('self', Share.js2internal({arguments: args}));
			for (var c = 0, arity = macroArgs.length; c < arity; c++) {
				if (c >= args.length) stack.put(macroArgs[c], undefined);
				else stack.put(macroArgs[c], args[c]);
			}
			processNodes(macroBody, stack, getProp, function(result) {
				stack.restore();
				ret(result);
			});
		});
		ret('');
	}

	function evalSelector(target, selector, stack, getProp, ret) {
		Utils.forEachAsync(selector, function(name, ret) {
			processNode(name, stack, getProp, function(name) {
				getProp(target, name, stack, function(value) {
					target = value;
					ret();
				});
			});
		}, function() { ret(target); });
	}

	function processSelector(selector, stack, getProp, ret) {
		var name = selector[0], selector = selector.slice(1);
		if (!Utils.isString(name)) {
			processNode(name, stack, getProp, function(value) {
				evalSelector(value, selector, stack, getProp, ret);
			});
		} else stack.get(name, function(value) {
			evalSelector(value, selector, stack, getProp, ret);
		});
	}

	function processCall(target, name, args, stack, getProp, ret) {

		name = [name];
		if (!target) target = [AST.SELECTOR, [name.shift()]];

		processSelector(target[1], stack, getProp, function(parent) {
			evalSelector(parent, name, stack, getProp, function(target) {

				if (!Utils.isFunction(target)) return ret();

				var callArgs = [];
				if (!Utils.isArray(args)) args = [];
				Utils.forEachAsync(args, function(arg, next) {
					processNode(arg, stack, getProp, function(arg) {
						callArgs.push(arg);
						next();
					});
				}, function() {
					try {
						target.call(stack, parent, callArgs, function(target) {
							ret(Share.js2internal(target));
						});
					} catch (exception) {
						ret();
					}
				});

			});
		});
	}

	function processNode(node, stack, getProp, ret) {
		if (!Utils.isArray(node)) return ret(node);
		var nodeType = node[0];
		switch (nodeType) {

			case AST.INT:
			case AST.STRING:
			case AST.DOUBLE: ret(node[1]); break;
			case AST.NULL: ret(null); break;
			case AST.TRUE: ret(true); break;
			case AST.FALSE: ret(false); break;
			case AST.MAP: processMap(node[1], stack, getProp, ret); break;

			case AST.NOT: processNot(node[1], stack, getProp, ret); break;
			case AST.OR: processOr(node[1], node[2], stack, getProp, ret); break;
			case AST.AND: processAnd(node[1], node[2], stack, getProp, ret); break;

			case AST.EQUAL: processEquality(node[1], node[2], false, stack, getProp, ret); break;
			case AST.NOT_EQUAL: processEquality(node[1], node[2], true, stack, getProp, ret); break;

			case AST.LESS_THAN:
			case AST.GREATER_THAN:
			case AST.LESS_OR_EQUAL:
			case AST.GREATER_OR_EQUAL:
				processRelational(nodeType, node[1], node[2], stack, getProp, ret); break;

			case AST.SUB:
			case AST.MUL:
			case AST.DIV:
			case AST.MOD:
			case AST.NEGATE:
				processArithmetical(nodeType, node[1], node[2], stack, getProp, ret); break;

			case AST.ADD: processAddition(node[1], node[2], stack, getProp, ret); break;
			case AST.IF: processIf(node[1], stack, getProp, ret); break;
			case AST.FOR: processFor(node[1], node[2], node[3], stack, getProp, ret); break;
			case AST.TERNARY: processTernary(node[1], node[2], node[3], stack, getProp, ret); break;
			case AST.STATEMENTS: processNodes(node[1], stack, getProp, ret); break;

			case AST.VAR: processVar(node[1], node[2], stack, getProp, ret); break;
			case AST.MACRO: processMacro(node[1], node[2], node[3], stack, getProp, ret); break;

			case AST.SELECTOR: processSelector(node[1], stack, getProp, ret); break;
			case AST.CALL: processCall(node[1], node[2], node[3], stack, getProp, ret); break;

			default:
				ret();
				throw(
					'unsupported template instruction "' + JSON.stringify(node) + '"'
				);
		}
	}

	function processNodes(nodes, stack, getProp, ret) {
		var result = '';
		Utils.forEachAsync(nodes, function(node, ret) {
			if (Utils.isArray(node)) {
				processNode(node, stack, getProp, function(node) {
					result += Share.nodeToString(node);
					ret();
				});
			} else {
				result += node;
				ret();
			}
		}, function() { ret(result); });
	}

	function processAST(nodes, stack, getProp, ret) {
		var signature = nodes[0];
		processNodes(nodes[1], stack, getProp, ret);
	}

	return processAST;

});