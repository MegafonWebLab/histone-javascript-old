with (exports) {

	/**
	 * Id of the property that is used to store node's comments.
	 * @type {Number}
	 * @const
	 */
	var COMMENT_PROP_ID = 9999;

	/**
	 * Keeps the reference to Utils module.
	 * Provides shortcut for easy access.
	 * @type {Object}
	 */
	var Utils = require('Utils');

	/**
	 * Provides a separate namespace for most often used Java classes.
	 * @type {Object}
	 */
	var Java = JavaImporter(
		org.mozilla.javascript.Token,
		org.mozilla.javascript.Context,
		org.mozilla.javascript.ErrorReporter,
		org.mozilla.javascript.CompilerEnvirons,
		org.mozilla.javascript.Parser,
		org.mozilla.javascript.ast.NodeVisitor
	);

	// get context associated with the current thread
	var context = Java.Context.getCurrentContext();
	// get compiler options instance
	var options = new Java.CompilerEnvirons();
	// get default error reporter
	var errorReporter = options.getErrorReporter();
	// set language version
	options.setLanguageVersion(180);
	// keep comments
	options.setRecordingComments(true);
	options.setRecordingLocalJsDocComments(true);
	// initialize parser options
	options.initFromContext(context);

	/**
	 * Retrieves the node type.
	 * @param {Object} node Node as an object.
	 * @return {String} Node type as a string.
	 */
	exports.getType = function(node) {
		var typeName = Java.Token.typeToName(node.type);
		typeName = String(typeName);
		typeName = typeName.toLowerCase();
		return typeName;
	};

	/**
	 * Retrieves the list of the comment nodes that belongs to the node.
	 * @param {Object} node Node as an object.
	 * @return {Array.<String>} Array of the comments.
	 */
	exports.getComments = function(node) {
		var comments = [];
		for each(comment in node.getProp(COMMENT_PROP_ID)
		) comments.push(String(comment.toSource()));
		return comments;
	};

	/**
	 *
	 *
	 */
	function wrapNode(node, props, type) {
		var cache = {};
		var result = {
			'type': (type || getType(node)),
			'toString': function() {
				return String(
					node.getProp(88888) ?
					node.getProp(88888) :
					node.toSource()
				);
			}
		};
		for (var key in props) (function(key) {
			var getter = props[key];
			var enumerable = true;
			if (key[0] === '@') {
				key = key.substr(1);
				enumerable = false;
			}
			result[key] = getter;
			if (!Utils.isFunction(getter)) return;
			Object.defineProperty(result, key, {
				enumerable: enumerable,
				get: function() {
					if (!cache[key]) {
						cache[key] = getter(node);
					}
					return cache[key];
				}
			});
		})(key);
		return result;
	}

	exports.parseNode = function(node) {
		switch (node.type) {

			case Java.Token.NULL: return wrapNode(node);

			case Java.Token.STRING: return wrapNode(node, {
				'value': String(node.value)
			});

			case Java.Token.NUMBER: return wrapNode(node, {
				'value': String(node.value)
			});

			case Java.Token.NAME: return wrapNode(node, {
				'value': String(node.string)
			});

			case Java.Token.FALSE:
			case Java.Token.TRUE: return wrapNode(node, {
				'value': (node.type === Java.Token.TRUE)
			}, 'boolean');

			case Java.Token.ARRAYLIT: return wrapNode(node, {
				'value': function(node) {
					var items = node.elements.toArray();
					return items.map(parseNode);
				}
			});

			case Java.Token.GETPROP: return wrapNode(node, {
				'value': function(node) {
					var path = [];
					for each(node in [node.left, node.right]) {
						path = path.concat(parseNode(node).value);
					}
					return path;
				}
			});

			case Java.Token.CALL: return wrapNode(node, {
				'name': function(node) {
					if (node.target.type === Java.Token.NAME) {
						return String(node.target.string);
					}
				},
				'args': function(node) {
					var args = node.arguments.toArray().concat([]);
					return args.map(parseNode);
				},
				'target': function(node) {
					if (node.target.type !== Java.Token.NAME) {
						return parseNode(node.target);
					}
				}
			});

			case Java.Token.VAR: return wrapNode(node, {
				'value': function(node) {
					var result = [];
					for each(variable in node.variables.toArray()) {
						result.push({
							'name': String(variable.target.string),
							'value': (
								variable.initializer ?
								parseNode(variable.initializer) :
								undefined
							)
						});
					}
					return result;
				}
			});

			case Java.Token.OBJECTLIT: return wrapNode(node, {
				'value': function(node) {
					var elements = {};
					for each(element in node.elements.toArray()) {
						var key = element.left.value;
						var value =  parseNode(element.right);
						elements[key] = value;
					}
					return elements;
				}
			});

			case Java.Token.FUNCTION: return wrapNode(node, {
				'name': node.name.length() ? String(node.name) : undefined,
				'args': function(node) {
					var args = node.getParams().toArray().concat([]);
					return args.map(function(arg) {
						return String(arg.string);
					});
				},
				'@body': function(node) {
					var value = [];
					var body = node.getBody();
					if (body.hasChildren()) {
						var child = body.firstChild;
						while (child) {
							value.push(parseNode(child));
							child = child.next;
						}
					}
					return value;
				}
			});

			default:
				return wrapNode(node, {
					'value': getType(node),
					'source': node.toSource()
				}, 'fragment');

		}
	};

	/**
	 * Parses source file and returns parseTree.
	 * @param {String} src Name of the file to parse.
	 * @return {Array.<*>} Array of objects that represents parseTree.
	 */
	exports.parse = function(src, data, visitor) {
		// initialize result tree
		var result = [];
		// initialize comments array
		var comments = [];
		// read source file if needed
		if (!data) data = readFile(src);
		// create instance of org.mozilla.javascript.Parser
		var parser = new Java.Parser(options, errorReporter);
		// parse source code
		var parseTree = parser.parse(data, src, 1);

		// create an array of nodes and their comments
		parseTree.visit(new Java.NodeVisitor({'visit': function(node) {
			if (node.type === Java.Token.SCRIPT) {
				// walk over all comment nodes
				if (node.comments) {
					for each(comment in node.comments.toArray()) {
						// push comment node into result array
						result.push(comment);
					}
				}
				if (!node.statements.size()) {
					// push node into result array
					result.push(node);
				}
			} else {
				//if (node.type === Java.Token.NUMBER) {
					node.putProp(88888, data.substr(
						node.getAbsolutePosition(),
						node.getLength()
					));
				//}
				// push node into result array
				result.push(node);
			}
			// continue the loop
			return true;
		}}));

		// sort array by their position in the source file
		result.sort(function(node1, node2) {
			return parseInt(
				node1.absolutePosition
			) > parseInt(
				node2.absolutePosition
			);
		});

		// assign node comments to the related nodes
		result.some(function(node) {
			// process comment node
			if (node.type === Java.Token.COMMENT) {
				// add it to the comments array
				comments.push(node);
			} else {
				// add comments if needed
				if (comments.length) {
					// assign comments to the node
					node.putProp(COMMENT_PROP_ID, comments);
					// clear comments array
					comments = [];
				}
				// fire visitor's callback
				return visitor(node);
			}
		});
	};
}