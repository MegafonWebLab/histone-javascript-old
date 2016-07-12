var UID_TIME_LAST = 0;
var UID_TIME_DIFF = 0;

var System = require('./System.js');
var Beautify = require('./Beautify.js');
var ENTITY_REGEXP = /&([a-z]+);/ig;
var XML_ENTITIES = ['quot', 'amp', 'apos', 'lt', 'gt'];

var URL_DIRNAME_REGEXP = /^(.*)\//;
var URL_PARSER_REGEXP = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;

function removeDotSegments(path) {
	var path = path.split('/');
	var isAbsolute = (path[0] === '');
	var result = [], fragment = '';
	if (isAbsolute) path.shift();
	while (path.length) {
		fragment = path.shift();
		if (fragment === '..') {
			result.pop();
		} else if (fragment !== '.') {
			result.push(fragment);
		}
	}
	if (isAbsolute) result.unshift('');
	if (fragment === '.' || fragment === '..') result.push('');
	return result.join('/');
}

with (exports) {

	exports.isUndefined = function(value) {
		return (value === undefined);
	};

	exports.isNull = function(value) {
		return (value === null);
	};

	exports.isBoolean = function(value) {
		return (typeof(value) === 'boolean');
	};

	exports.isNumber = function(value) {
		return (typeof(value) === 'number');
	};

	exports.isString = function(value) {
		return (typeof(value) === 'string');
	};

	exports.isArray = function(value) {
		return (value instanceof Array);
	};

	exports.isObject = function(value) {
		return (value instanceof Object);
	};

	exports.isMap = function(value) {
		return (isObject(value) && !isArray(value));
	};

	exports.isFunction = function(value) {
		return (value instanceof Function);
	};

	exports.isNumeric = function(value) {
		return (!isNaN(parseFloat(value)) && isFinite(value));
	};

	exports.isXML = function(value) {
		return (typeof(value) === 'xml');
	};

	exports.isRegExp = function(value) {
		return (value instanceof RegExp);
	};

	exports.args2arr = function(args, index) {
		return Array.prototype.slice.call(args, index || 0);
	};

	exports.getFunctionArguments = function(value) {
		if (!isFunction(value)) return [];
		var functionArity = value.length;
		var functionValue = value.toString();
		var functionArguments = functionValue.split(')', 2).shift();
		functionArguments = functionArguments.split('(', 2).pop();
		return functionArguments.split(/\s?,\s?/, functionArity);
	};

	exports.getFunctionBody = function(value) {
		if (!isFunction(value)) return '';
		var functionBody = value.toString();
		functionBody = functionBody.split('{').slice(1).join('{');
		functionBody = functionBody.split('}').slice(0, -1).join('}');
		functionBody = functionBody.replace(/^\s+/, '').replace(/\s+$/, '');
		functionBody = functionBody.replace(/;$/, '');
		functionBody = ('\r\n' + functionBody + '\r\n');
		return functionBody;
	};

	exports.setFunctionArguments = function(value, args) {
		if (!isFunction(value)) value = new Function();
		if (isUndefined(args)) argumentsList = [];
		if (!isArray(args)) argumentsList = [args];
		var functionBody = getFunctionBody(value);
		return new Function(argumentsList, functionBody);
	};

	exports.uniqueId = function(prefix) {
		if (!isString(prefix)) prefix = '';
		var partOne = new Date().getTime();
		if (partOne > UID_TIME_LAST) UID_TIME_DIFF = 0;
		else partOne += (++UID_TIME_DIFF);
		UID_TIME_LAST = partOne;
		return (prefix + partOne.toString(36) +
			(1 + Math.floor((Math.random()*32767))).toString(36) +
			(1 + Math.floor((Math.random()*32767))).toString(36)
		);
	};

	exports.beautify = function(value) {
		if (isXML(value)) return value.toXMLString();
		return Beautify(
			isFunction(value) ?
			String(value) :
			String(JSON.stringify(value))
		);
	};

	exports.print = function(value) {
		var args = args2arr(arguments);
		args = args.map(beautify);
		System.print.apply(this, args);
	};

	exports.value2xml = function(value) {
		return ('<root>' + (isObject(value) ? function(value) {
			var result = '';
			if (isArray(value)) {
				for (var c = 0; c < value.length; c++) {
					result += '<item index="' + c + '">';
					result += arguments.callee(value[c]);
					result += '</item>';
				}
			} else if (isObject(value)) {
				for (var key in value) {
					if (value.hasOwnProperty(key)) {
						result += '<' + key + '>';
						result += arguments.callee(value[key]);
						result += '</' + key + '>';
					}
				}
			} else {
				result = String(value || '');
			}
			return result;
		}(value) : value || '') + '</root>');
	};

	exports.preserveEntities = function(value) {
		return value.replace(ENTITY_REGEXP, function(entity, name) {
			// skip predefined XML entities
			if (XML_ENTITIES.indexOf(name) !== -1) {
				return entity;
			} else {
				return ('&amp;' + name + ';');
			}
		});
	};

	exports.parseURI = function(uri) {
		var result = uri.match(URL_PARSER_REGEXP);
		return {
			'scheme': (result[1] || ''),
			'authority': (result[2] || ''),
			'path': (result[3] || ''),
			'query': (result[4] || ''),
			'fragment': (result[5] || '')
		};
	};

	exports.resolveURI = function(uri, base, urlArgs) {
		var relUri = parseURI(uri);
		var baseUri = parseURI(base);
		var res = '', ts = '';
		if (relUri.scheme) {
			res += (relUri.scheme + ':');
			if (ts = relUri.authority) res += ('//' + ts);
			if (ts = removeDotSegments(relUri.path)) res += ts;
			if (ts = relUri.query) res += ('?' + ts);
		} else {
			if (ts = baseUri.scheme) res += (ts + ':');
			if (ts = relUri.authority) {
				res += ('//' + ts);
				if (ts = removeDotSegments(relUri.path || '')) res += ts;
				if (ts = relUri.query) res += ('?' + ts);
			} else {
				if (ts = baseUri.authority) res += ('//' + ts);
				if (ts = relUri.path) {
					if (ts = removeDotSegments(ts.charAt(0) === '/' ? ts : (
						baseUri.authority && !baseUri.path ? '/' :
						(baseUri.path.match(URL_DIRNAME_REGEXP) || [''])[0]
					) + ts)) res += ts;
					if (ts = relUri.query) res += ('?' + ts);
				} else {
					if (ts = baseUri.path) res += ts;
					if ((ts = relUri.query) ||
						(ts = baseUri.query)) res += ('?' + ts);
				}
			}
		}
		if (urlArgs) res += urlArgs;
		if (ts = relUri.fragment) res += ('#' + ts);
		return res;
	};

	exports.parseQuery = function(query) {
		var result = {};
		if (!isString(query)) return {};
		var query = query.split('&');
		var frag, length = query.length;
		for (var c = 0; c < length; c++) {
			frag = query[c].split('=', 2);
			result[frag[0]] = frag[1];
		}
		return result;
	};

	exports.getCommonSubstring = function(string) {
		var string = string.slice(0).sort();
		var tem1 = string[0], tem2 = string.pop();
		var index = tem1.length;
		while(index && tem2.indexOf(tem1) == -1) {
			tem1 = tem1.substring(0, --index);
		}
		return tem1;
	};

	exports.forEachAsync = function(list, iterator, ret) {
		if (!(list instanceof Object)) ret();
		var keys, key, length, last;
		var i = -1, calls = 0, looping = false;
		if (!(list instanceof Array)) {
			keys = Object.keys(list);
			length = keys.length;
		} else {
			length = list.length;
		}
		last = length - 1;
		var resume = function() {
			calls += 1;
			if (looping) return;
			looping = true;
			while (calls > 0) {
				calls -= 1, i += 1;
				if (i === length) return ret();
				key = (keys ? keys[i] : i);
				iterator(list[key], function(stop) {
					if (stop === true) ret();
					else resume();
				}, key, i, last);
			}
			looping = false;
		};
		resume();
	};

}