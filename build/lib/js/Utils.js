/**
 * Utils.js - Histone template engine.
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

with (exports) {

	/**
	 * Reference to the system print function.
	 * @type {Function}
	 * @const
	 */
	var SYSTEM_PRINT = print;

	/**
	 * Regular expression matches XML entity reference.
	 * @type {Object}
	 * @const
	 */
	var ENTITY_REGEXP = /&([a-z]+);/ig;

	/**
	 * List of predefined XML entities.
	 * @type {Array.<string>}
	 * @const
	 */
	var XML_ENTITIES = ['quot', 'amp', 'apos', 'lt', 'gt'];

	/**
	 * Keeps timestamp of last generated unique identifier.
	 * @type {Number}
	 */
	var UID_TIME_LAST = 0;

	/**
	 * Keeps time difference between last generated unique identifiers.
	 * @type {Number}
	 */
	var UID_TIME_DIFF = 0;

	/**
	 * Unique identifier prefix (see uniqueId).
	 * @type {string}
	 * @const
	 */
	var UNIQUE_IDENT_PREFIX = 'uip$';

	/**
	 * Returns true if the value is undefined.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is undefined.
	 */
	exports.isUndefined = function(value) {
		return (typeof(value) === 'undefined');
	};

	/**
	 * Returns true if the value is null.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is null.
	 */
	exports.isNull = function(value) {
		return (value === null);
	};

	/**
	 * Returns true if the value is boolean.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is boolean.
	 */
	exports.isBoolean = function(value) {
		return (typeof(value) === 'boolean');
	};

	/**
	 * Returns true if the value is number.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is number.
	 */
	exports.isNumber = function(value) {
		return (typeof(value) === 'number');
	};

	/**
	 * Returns true if the value is string.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is string.
	 */
	exports.isString = function(value) {
		return (typeof(value) === 'string');
	};

	/**
	 * Returns true if the value is array.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is array.
	 */
	exports.isArray = function(value) {
		return (isObject(value) && value.constructor === Array);
	};

	/**
	 * Returns true if the value is object.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is object.
	 */
	exports.isObject = function(value) {
		return (!isNull(value) && typeof(value) === 'object');
	};

	/**
	 * Returns true if the value is function.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is function.
	 */
	exports.isFunction = function(value) {
		return (typeof(value) === 'function');
	};

	/**
	 * Returns true if the value is E4X XML object.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is E4X XML object.
	 */
	exports.isXML = function(value) {
		return (typeof(value) === 'xml');
	};

	/**
	 * Returns true if the value is RegExp instance.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is RegExp instance.
	 */
	exports.isRegExp = function(value) {
		return (value instanceof RegExp);
	};

	/**
	 * Retrieves the list of function arguments.
	 * @param {Function} value Function object to process.
	 * @return {Array.<string>} Array of function arguments names.
	 */
	exports.getFunctionArguments = function(value) {
		if (!isFunction(value)) return [];
		var functionArity = value.length;
		var functionValue = value.toString();
		var functionArguments = functionValue.split(')', 2).shift();
		functionArguments = functionArguments.split('(', 2).pop();
		return functionArguments.split(/\s?,\s?/, functionArity);
	};

	/**
	 * Extracts function body from the function object
	 * and returns it as a string.
	 * @param {Function} value Function object to process.
	 * @return {string} Function body as a string.
	 */
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

	/**
	 * Sets function arguments names.
	 * @param {Function} value Function object to process.
	 * @param {Array.<string>} args Array with argument names.
	 * @return {Function} New function object with updated arguments list.
	 */
	exports.setFunctionArguments = function(value, args) {
		if (!isFunction(value)) value = new Function();
		if (isUndefined(args)) argumentsList = [];
		if (!isArray(args)) argumentsList = [args];
		var functionBody = getFunctionBody(value);
		return new Function(argumentsList, functionBody);
	};

	/**
	 * Converts arguments object into array of arguments.
	 * @param {Object} args Arguments object to process.
	 * @param {number=} index First argument offset.
	 * @return {Array.<*>} Arguments array.
	 */
	exports.args2arr = function(args, index) {
		return Array.prototype.slice.call(args, index || 0);
	};

	/**
	 * Generates unique identifier based on UNIX timestamp.
	 * @return {string} Unique JavaScript identifier.
	 */
	exports.uniqueId = function(prefix) {
		if (!isString(prefix)) prefix = '';
		if (!prefix) prefix = UNIQUE_IDENT_PREFIX;
		var now = new Date().getTime();
		if (now > UID_TIME_LAST) UID_TIME_DIFF = 0;
		else now += (++UID_TIME_DIFF);
		UID_TIME_LAST = now;
		return (prefix + now.toString(36));
	};

	/**
	 * Formats the value using js_beautify.
	 * @param {*} value Value to format.
	 * @return {string} Formatted value.
	 */
	exports.beautify = function(value) {
		if (isXML(value)) return value.toXMLString();
		return (require('Beautify').js_beautify(
			isFunction(value) ?
			value.toString() :
			String(JSON.stringify(value))
		));
	};

	/**
	 * Beautifies the value and prints it.
	 * Shortcut for print(beautify(JSON.parse(value))).
	 * @param {*} value Value to print.
	 */
	exports.print = function(value) {
		var args = args2arr(arguments);
		args = args.map(beautify);
		SYSTEM_PRINT.apply(this, args);
	};

	/**
	 * Converts value to XML string.
	 * @param {*} value Value to convert.
	 * @return {string} Returns value converted to XML string.
	 */
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

	/**
	 * Preserves non - XML entities in the string.
	 * @param {string} value XML string.
	 * @return {string} Returns XML string with all undefined XML entities
	 * converted to their safe equivalents (&amp; prefixed).
	 */
	exports.preserveEntities = function(value) {
		return value.replace(
			ENTITY_REGEXP, function(entity, name) {
				// skip predefined XML entities
				if (XML_ENTITIES.indexOf(name) !== -1) {
					return entity;
				} else {
					return ('&amp;' + name + ';');
				}
			}
		);
	};

	/**
	 * Gets the value of the specified environment variable.
	 * @param {string | Object} name Environment variable name,
	 *     passed as string or RegExp object.
	 * @return {string | Object} Value as a string or map.
	 */
	exports.getEnv = function(name) {
		if (isString(name)) {
			var value = java.lang.System.getenv(name);
			return (value ? String(value) : null);
		}
		var result = {};
		var regExp = isRegExp(name);
		var value = java.lang.System.getenv();
		var keySet = value.keySet().toArray();
		for (var c = 0; c < keySet.length; c++) {
			var key = String(keySet[c]);
			if (regExp) {
				var matches = key.match(name);
				if (!matches) continue;
				var val = String(value.get(key));
				result[matches[1] || key] = val;
			} else {
				result[key] = String(value.get(key));
			}
		}
		return result;
	};

	/**
	 * Gets the value of the specified system property.
	 * @param {string | Object} name System property name,
	 *     passed as string or RegExp object.
	 * @return {string | Object} Value as a string or map.
	 */
	exports.getProp = function(name) {
		if (isString(name)) {
			var value = java.lang.System.getProperty(name);
			return (value ? String(value) : null);
		}
		var result = {};
		var regExp = isRegExp(name);
		var value = java.lang.System.getProperties();
		var keySet = value.keySet().toArray();
		for (var c = 0; c < keySet.length; c++) {
			var key = String(keySet[c]);
			if (regExp) {
				var matches = key.match(name);
				if (!matches) continue;
				var val = String(value.get(key));
				result[matches[1] || key] = val;
			} else {
				result[key] = String(value.get(key));
			}
		}
		return result;
	};

}