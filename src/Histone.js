/**
 * Histone.js - Histone template engine.
 * Copyright 2012 MegaFon
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define([
	'!module', 'ClientInfo', 'Utils',
	'CallStack', 'OrderedMap', 'Share', 'Processor',
	'parser/Parser', 'parser/Constants',
	'network/Network'
], function(
	Module, ClientInfo, Utils,
	CallStack, OrderedMap, Share, Processor,
	Parser, AST, Network
) {

	var URIResolver = null;
	var AST_HEADER = ['HISTONE', ClientInfo];

	var envType = Utils.getEnvType();
	var clientType = ('javascript/' + envType);
	var userAgent = Utils.getEnvInfo();

	function getResource(requestURI, baseURI, ret, requestProps, isJSONP) {
		try {
			if (Utils.isFunction(URIResolver) && URIResolver(
				requestURI, baseURI, function(resourceData, resourceURI) {
				if (!Utils.isString(resourceURI)) resourceURI = requestURI;
				ret(resourceData, resourceURI);
			}, Share.internal2js(requestProps), isJSONP) === true) return;
		} catch (e) {}
		Network(requestURI, baseURI, ret, requestProps, isJSONP);
	}

	function resourceToTpl(resourceData) {
		if (Utils.isString(resourceData) &&
			resourceData.match(/^\s*\[\s*\[\s*"HISTONE"/)) {
			try { resourceData = JSON.parse(resourceData); }
			catch (e) {}
		}
		return resourceData;
	}

	function getProperty(value, name, stack, ret) {
		var vChain = [], vClass, getter;

		switch (Utils.getBaseType(value)) {
			case Utils.T_UNDEFINED: vChain = [Histone.Type]; break;
			case Utils.T_NULL: vChain = [Histone.Type]; break;
			case Utils.T_BOOLEAN: vChain = [Histone.Type]; break;
			case Utils.T_NUMBER: vChain = [Histone.Number, Histone.Type]; break;
			case Utils.T_STRING: vChain = [Histone.String, Histone.Type]; break;
			case Utils.T_FUNCTION: vChain = [Histone.Type]; break;
			case Utils.T_OBJECT:
				if (value === Histone.Global) { vChain = [Histone.Global, Histone.Type]; break; }
				if (value instanceof OrderedMap) { vChain = [Histone.Map, Histone.Type]; break; }
			default: throw 'INTERNAL ERROR';
		}

		for (var c = 0; c < vChain.length; c++) {
			vClass = vChain[c];

			if (vClass.hasOwnProperty('.' + name)) {
				getter = vClass['.' + name];
				if (Utils.isFunction(getter))
					return getter.call(stack, value, [], ret);
				else return ret(getter);
			}

			else if (name && vClass.hasOwnProperty(name)) {
				return ret(vClass[name]);
			}




		}

		vClass = vChain[0];

		if (vClass.hasOwnProperty('')) {
			getter = vClass[''];
			if (Utils.isFunction(getter))
				return getter.call(stack, value, [name], ret);
			else return ret(getter);
		}

		else ret();

	}

	function Template(templateAST, baseURI) {

		if (!Utils.isString(baseURI)) baseURI = '.';

		this.getAST = function() {
			return templateAST;
		};

		this.render = function() {
			// initialize variables
			var context = undefined;
			var ret = null, stack = null;
			var callArgs = [], callName = null;
			var args = Array.prototype.slice.call(arguments);
			// check if first argument is macro name
			if (Utils.isString(args[0])) {
				callName = args.shift();
				// check if second argument is macro arguments
				if (!Utils.isFunction(args[0])) {
					callArgs = args.shift();
					// convert arguments to array if needed
					if (!Utils.isArray(callArgs)) callArgs = [callArgs];
					for (var c = 0; c < callArgs.length; c++) {
						// convert argument to it's internal form
						callArgs[c] = Share.js2internal(callArgs[c]);
					}
				}
			}
			// check for callback argument
			if (Utils.isFunction(args[0])) {
				ret = args.shift();
			}
			// check for context argument
			if (args[0] instanceof CallStack) {
				stack = args.shift();
			} else {

				// convert context to it's internal form
				context = Share.js2internal(args[0]);
				stack = new CallStack(Histone.Global, context, getProperty);
				stack.setBaseURI(baseURI);
			}


			Processor(templateAST, stack, getProperty, function(result) {
				if (callName !== null) stack.get(callName, function(value) {
					if (!Utils.isFunction(value)) return ret(undefined, stack);
					console.error(value);
					// callMacro(callHandler, callArgs, stack, function(value) {
					// 	ret(value, stack);
					// });
				}); else ret(result, stack);
			});

		};

	}

	var Histone = function(template, baseURI) {
		if (Utils.isString(template)) {
			template = Parser(template, baseURI);
			template = [AST_HEADER, template];
		} else if (template instanceof Template) {
			template = template.getAST();
		} else if (Utils.isDOMElement(template)) {
			template = (template.text || template.textContent);
			return Histone(template, baseURI);
		} else if (!Utils.isArray(template)) {
			template = String(template);
			throw('"' + template + '" is not a string');
		}
		return new Template(template, baseURI);
	};

	Histone.OrderedMap = OrderedMap;

	Histone.version = ClientInfo.version;

	Histone.Type = {

		isUndefined: function(value, args, ret) {
			ret(Utils.isUndefined(value));
		},

		isNull: function(value, args, ret) {
			ret(Utils.isNull(value));
		},

		isBoolean: function(value, args, ret) {
			ret(Utils.isBoolean(value));
		},

		isCallable: function(value, args, ret) {
			ret(Utils.isFunction(value));
		},

		isNumber: function(value, args, ret) {
			ret(Utils.isNumber(value));
		},

		isString: function(value, args, ret) {
			ret(Utils.isString(value));
		},

		isMap: function(value, args, ret) {
			ret(Utils.isObject(value) && value instanceof OrderedMap);
		},

		toJSON: function(value, args, ret) {
			if (Utils.isUndefined(value)) return ret('null');
			ret(JSON.stringify(value));
		},

		toMap: function(value, args, ret) {
			if (value instanceof OrderedMap) return ret(value);
			ret(new OrderedMap().set(null, value));
		},

		toString: function(value, args, ret) {
			ret(Share.nodeToString(value));
		},

		toBoolean: function(value, args, ret) {
			ret(Share.nodeToBoolean(value));
		}
	};

	Histone.Number = {

		isInteger: function(value, args, ret) {
			ret(value % 1 === 0);
		},

		isFloat: function(value, args, ret) {
			ret(value % 1 !== 0);
		},

		toChar: function(value, args, ret) {
			ret(String.fromCharCode(value));
		},

		toFixed: function(value, args, ret) {
			var precision = args[0];
			if (Utils.isNumber(precision) && precision >= 0) {
				var power = Math.pow(10, precision || 0);
				ret(Math.round(value * power) / power);
			} else ret(value);
		},

		abs: function(value, args, ret) {
			ret(Math.abs(value));
		},

		floor: function(value, args, ret) {
			ret(Math.floor(value));
		},

		ceil: function(value, args, ret) {
			ret(Math.ceil(value));
		},

		round: function(value, args, ret) {
			ret(Math.round(value));
		},

		pow: function(value, args, ret) {
			var exp = args[0];
			if (!Utils.isNumber(exp)) return ret();
			var result = Math.pow(value, exp);
			if (isNaN(result)) return ret();
			ret(result);
		},

		log: function(value, args, ret) {
			if (value <= 0) return ret();
			var result, base = args[0];

			if (Utils.isNumber(base) && base > 0) {
				result = Math.log(value) / Math.log(base);
			} else result = Math.log(value);

			if (isNaN(result)) return ret();
			if (!isFinite(result)) return ret();
			ret(result);
		}

	};

	Histone.String = {

		'': function(value, args, ret) {
			var index = parseFloat(args[0], 10);
			if (isNaN(index)) return ret();
			var length = value.length;
			if (index < 0) index = length + index;
			if (index % 1 !== 0 ||
				index < 0 ||
				index >= length) {
				return ret();
			}
			ret(value[index]);
		},

		size: function(value, args, ret) {
			ret(value.length);
		},

		strip: function(value, args, ret) {
			var chars = '', arg;
			while (args.length) {
				arg = args.shift();
				if (!Utils.isString(arg)) continue;
				chars += arg;
			}
			if (chars.length === 0) chars = ' \n\r\t';
			var start = -1, length = value.length;
			while (start < length && chars.indexOf(value.charAt(++start)) !== -1) {};
			while (length >= 0 && chars.indexOf(value.charAt(--length)) !== -1){};
			ret(value.slice(start, length + 1));
		},

		slice: function(value, args, ret) {
			var start = args[0];
			var length = args[1];
			var strLen = value.length;
			if (!Utils.isNumber(start)) start = 0;
			if (start < 0) start = strLen + start;
			if (start < 0) start = 0;
			if (start < strLen) {
				if (!Utils.isNumber(length)) length = 0;
				if (length === 0) length = strLen - start;
				if (length < 0) length = strLen - start + length;
				if (length <= 0) ret('');
				else ret(value.substr(start, length));
			} else ret('');
		},

		test: function(value, args, ret) {
			var regExp = args[0];
			if (Utils.isString(regExp)) {
				ret(value.match(regExp) !== null);
			} else ret(false);
		},

		toLowerCase: function(value, args, ret) {
			ret(value.toLowerCase());
		},

		toUpperCase: function(value, args, ret) {
			ret(value.toUpperCase());
		},

		split: function(value, args, ret) {
			var splitter = args[0];
			if (!Utils.isString(splitter)) splitter = '';
			ret(value.split(splitter));
		},

		charCodeAt: function(value, args, ret) {
			var index = parseFloat(args[0], 10);
			if (isNaN(index)) return ret();
			var length = value.length;
			if (index < 0) index = length + index;
			if (index % 1 !== 0 ||
				index < 0 ||
				index >= length) {
				return ret();
			}
			ret(value.charCodeAt(index));
		},

		toNumber: function(value, args, ret) {
			if (!Utils.isNumeric(value)) ret();
			else ret(parseFloat(value, 10));
		}
	};

	Histone.Map = {

		'': function(value, args, ret) {
			ret(value.get(args[0]));
		},

		size: function(value, args, ret) {
			ret(value.length());
		},

		join: function(value, args, ret) {
			ret(value.join(args[0]));
		},

		resize: function(value, args, ret) {
			var newLength = args[0];
			var fillValue = args[1];
			var result = value.clone();
			var keys = result.keys();
			var currLength = keys.length;
			if (!Utils.isNumber(newLength) ||
				newLength === currLength) {
				return ret(result);
			}
			if (newLength > currLength) {
				for (var c = 0; c < newLength - currLength; c++) {
					result.set(null, fillValue);
				}
			} else if (newLength < currLength) {
				var index = (currLength - newLength);
				while (index--) {
					result.remove(keys.pop());
				}
			}
			return ret(result);
		},

		search: function(value, args, ret) {
			var needle = args[0];
			var offset = args[1];
			if (Utils.isObject(needle)) return ret();
			var keys = value.keys();
			var values = value.values();
			if (!Utils.isNumber(offset)) offset = 0;
			if (offset >= 0 && offset > values.length ||
				offset < 0 && Math.abs(offset) > values.length) {
				return ret();
			}
			if (offset >= 0) {
				for (var c = offset; c < values.length; c++) {
					if (values[c] !== needle) continue;
					return ret(keys[c]);
				}
			} else if (offset < 0) {
				offset = values.length + offset;
				for (var c = offset; c >= 0; c--) {
					if (values[c] !== needle) continue;
					return ret(keys[c]);
				}
			}
			ret();
		},

		set: function(value, args, ret) {
			var key = args[0], val = args[1];
			var value = value.clone();
			if (!Utils.isString(key) &&
				!Utils.isNumeric(key)) {
				return ret(value);
			}
			if (Utils.isUndefined(val))
				value.remove(key);
			else value.set(key, val);
			ret(value);
		},

		keys: function(value, args, ret) {
			ret(value.keys());
		},

		values: function(value, args, ret) {
			ret(value.values());
		},

		hasKey: function(value, args, ret) {
			ret(value.hasKey(args[0]));
		},

		remove: function(value, args, ret) {
			var key, result = value.clone();
			while (args.length) {
				key = args.shift();
				result.remove(key);
			}
			ret(result);
		},

		slice: function(value, args, ret) {
			var offset = args[0];
			var length = args[1];
			var result = value.clone();
			result.slice(offset, length);
			ret(result);
		},

		toQueryString: function(value, args, ret) {
			var numPrefix = args[0], separator = args[1];
			ret(value.toQueryString(numPrefix, separator, Share.nodeToString));
		},

		toJSON: function(value, args, ret) {
			// REFACTOR IN ORDER TO SUPPORT ITEMS ORDER
			ret(JSON.stringify(value.toObject()));
		}

	};

	Histone.Global = {

		clientType: clientType,
		clientInfo: Share.js2internal(ClientInfo),
		userAgent: userAgent,

		'.baseURI': function(value, args, ret) {
			ret(this.getBaseURI());
		},

		resolveURI: function(value, args, ret) {
			var uri = args[0], baseURI = args[1];
			if (!Utils.isString(uri)) uri = Share.nodeToString(uri);
			if (!Utils.isString(baseURI)) return ret(uri);
			ret(Utils.uri.resolve(uri, baseURI));
		},

		isMap: function(value, args, ret) {
			ret(true);
		},

		uniqueId: function(value, args, ret) {
			ret(Utils.uniqueId());
		},

		loadJSON: function(value, args, ret) {
			var requestURI = args.shift();
			if (!Utils.isString(requestURI)) return ret();
			var requestProps = (!Utils.isBoolean(args[0]) && args.shift());
			var isJSONP = (Utils.isBoolean(args[0]) && args[0]);
			getResource(requestURI, this.getBaseURI(), function(data) {
				if (!Utils.isString(data)) {
					data = Share.js2internal(data);
					return ret(data);
				}
				if (isJSONP) {
					data = data.replace(/^\s*[$A-Z_][0-9A-Z_$]*\s*\(\s*/i, '');
					data = data.replace(/\s*\)\s*;?\s*$/, '');
				}
				try {
					data = JSON.parse(data);
					data = Share.js2internal(data);
					ret(data);
				} catch (e) { ret(); }
			}, requestProps, isJSONP);
		},

		loadText: function(value, args, ret) {
			var requestURI = args[0], requestProps = args[1];
			if (!Utils.isString(requestURI)) return ret();
			getResource(requestURI, this.getBaseURI(), function(resourceData) {
				ret(Utils.isString(resourceData) ? resourceData : undefined);
			}, requestProps);
		},

		include: function(value, args, ret) {
			var requestURI = args[0];
			if (!Utils.isString(requestURI)) return ret();
			var context = args[1], requestProps = args[2];
			getResource(requestURI, this.getBaseURI(), function(resourceData, resourceURI) {
				try {
					resourceData = resourceToTpl(resourceData);
					resourceData = Histone(resourceData, resourceURI);
					resourceData.render(ret, Share.js2internal(context));
				} catch (e) { ret(); }
			}, requestProps);
		},

		require: function(value, args, ret) {
			var requestURI = args[0];
			if (!Utils.isString(requestURI)) return ret();
			getResource(requestURI, this.getBaseURI(), function(resourceData, resourceURI) {
				if (Utils.isUndefined(resourceData)) return ret();
				resourceData = resourceToTpl(resourceData);
				resourceData = Histone(resourceData, resourceURI);
				resourceData.render(function(result, stack) {
					var exports = new OrderedMap();
					var exportVars = stack.variables[0];
					for (var exportName in exportVars)
						exports.set(exportName, exportVars[exportName]);
					ret(exports);
				});
			});
		},

		rand: function(value, args, ret) {
			var min = parseFloat(args[0]);
			var max = parseFloat(args[1]);
			if (!Utils.isNumber(min) || min % 1 !== 0) {
				min = 0;
			}
			if (!Utils.isNumber(max) || max % 1 !== 0) {
				max = Math.pow(2, 32) - 1;
			}
			ret(Math.floor(Math.random() * (max - min + 1)) + min);
		},

		min: function(value, args, ret) {

			function findMinimal(values) {
				var objKey, objValues;
				var count = values.length;
				var currValue, minValue = undefined;
				for (var c = 0; c < count; c++) {
					currValue = values[c];
					if (Utils.isObject(currValue)) {
						if (!Utils.isArray(currValue)) {
							objValues = [];
							for (objKey in currValue)
								objValues.push(currValue[objKey]);
							currValue = objValues;
						}
						currValue = findMinimal(currValue);
					}
					if (Utils.isNumber(currValue) && (
						Utils.isUndefined(minValue) ||
						currValue < minValue
					)) minValue = currValue;
				}
				return minValue;
			}

			ret(findMinimal(Share.internal2js(args)));
		},

		max: function(value, args, ret) {

			function findMaximal(values) {
				var objKey, objValues;
				var count = values.length;
				var currValue, minValue = undefined;
				for (var c = 0; c < count; c++) {
					currValue = values[c];
					if (Utils.isObject(currValue)) {
						if (!Utils.isArray(currValue)) {
							objValues = [];
							for (objKey in currValue)
								objValues.push(currValue[objKey]);
							currValue = objValues;
						}
						currValue = findMaximal(currValue);
					}
					if (Utils.isNumber(currValue) && (
						Utils.isUndefined(minValue) ||
						currValue > minValue
					)) minValue = currValue;
				}
				return minValue;
			}

			ret(findMaximal(Share.internal2js(args)));
		},

		range: function(value, args, ret) {
			var result = [];
			var start = parseFloat(args[0]);
			var end = parseFloat(args[1]);
			if (!Utils.isNumber(start) ||
				!Utils.isNumber(end) ||
				start % 1 !== 0 ||
				end % 1 !== 0) {
				return ret();
			}
			if (start > end) {
				for (var i = start; i >= end; i -= 1) result.push(i);
			} else if (start < end) {
				for (var i = start; i <= end; i += 1) result.push(i);
			} else result.push(start);
			ret(result);
		},

		dayOfWeek: function(value, args, ret) {
			var year = parseFloat(args[0]);
			var month = parseFloat(args[1]);
			var day = parseFloat(args[2]);
			if (!Utils.isNumber(year) ||
				!Utils.isNumber(month) ||
				!Utils.isNumber(day) ||
				year % 1 !== 0 ||
				month % 1 !== 0 ||
				day % 1 !== 0) {
				return ret();
			}
			var date = new Date(year, month -= 1, day);
			if (date.getFullYear() == year &&
				date.getMonth() == month &&
				date.getDate() == day) {
				var day = date.getDay();
				ret(day ? day : 7);
			} else ret();
		},

		daysInMonth: function(value, args, ret) {
			var year = parseFloat(args[0]);
			var month = parseFloat(args[1]);
			if (!Utils.isNumber(year) ||
				!Utils.isNumber(month) ||
				year % 1 !== 0 ||
				month % 1 !== 0 ||
				month < 1 ||
				month > 12) {
				return ret();
			}
			var date = new Date(year, month, 0);
			ret(date.getDate());
		}
	};

	Histone.krang = function(baseURI, pluginURI, load, krang) {
		var requestURI = Utils.uri.parse(pluginURI);
		if (requestURI.fileType !== 'tpl') {
			krang({packages: {
				'histone': Module.uri
			}}).require(Utils.uri.resolve(pluginURI, baseURI), load);
		} else Network(pluginURI, baseURI, function(resourceData, resourceURI) {
			load(Histone(resourceData, resourceURI));
		});
	};

	Histone.load = function(name, req, load, config) {
		var requestObj = Utils.uri.parse(name);
		var requestType = requestObj.path.split('.').pop();
		if (requestType !== 'tpl' &&
			requestObj.scheme !== 'data') {
			if (typeof curl === 'function') {
				curl({paths: {'Histone': Module.uri}});
				req([req.toUrl(name)], load);
				curl(config);
			} else if (typeof require === 'function') {
				require.config({'map': {
					'*': {'Histone': Module.id}
				}})([req.toUrl(name)], load);
			}
		} else Network(name, window.location.href, function(
			resourceData, resourceURI) {
			resourceData = resourceToTpl(resourceData);
			load(Histone(resourceData, resourceURI));
		});
	};

	Histone.setURIResolver = function(callback) {
		if (!Utils.isFunction(callback)) {
			URIResolver = null;
		} else {
			URIResolver = callback;
		}
	};

	return Histone;

});