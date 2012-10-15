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

define(function() {

	var UID_TIME_LAST = 0;
	var UID_TIME_DIFF = 0;

	var ENV_TYPE = null;
	var ENV_INFO = null;

	var T_UNDEFINED = 1;
	var T_NULL = 2;
	var T_BOOLEAN = 3;
	var T_NUMBER = 4;
	var T_STRING = 5;
	var T_FUNCTION = 6;
	var T_ARRAY = 7;
	var T_OBJECT = 8;

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

	/**
	 * Returns true if the value is undefined.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is undefined.
	 */
	function isUndefined(value) {
		return (value === undefined);
	}

	/**
	 * Returns true if the value is null.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is null.
	 */
	function isNull(value) {
		return (value === null);
	}

	/**
	 * Returns true if the value is boolean.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is boolean.
	 */
	function isBoolean(value) {
		return (typeof(value) === 'boolean');
	}

	/**
	 * Returns true if the value is number.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is number.
	 */
	function isNumber(value) {
		return (typeof(value) === 'number');
	}

	/**
	 * Returns true if the value is string.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is string.
	 */
	function isString(value) {
		return (typeof(value) === 'string');
	}

	/**
	 * Returns true if the value is array.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is array.
	 */
	function isArray(value) {
		return (value instanceof Array);
	}

	/**
	 * Returns true if the value is object.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is object.
	 */
	function isObject(value) {
		return (value instanceof Object);
	}

	/**
	 * Returns true if the value is function.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is function.
	 */
	function isFunction(value) {
		return (value instanceof Function);
	}

	/**
	 * Returns true if the value is numeric (can be converted to number).
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value if numeric.
	 */
	function isNumeric(value) {
		return (!isNaN(parseFloat(value)) && isFinite(value));
	}

	/**
	 * Returns true if the value is HTML DOM element.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is HTML DOM element.
	 */
	function isDOMElement(value) {
		try {
			return value instanceof HTMLElement;
		} catch (exception) { return (
			typeof(value) === 'object' &&
			value.nodeType === 1
		); }
	}

	/**
	 * Returns value's base type (according to the base types list).
	 * @param {*} value Value to check.
	 * @return {string|*} Returns value's base type name.
	 */
	function getBaseType(value) {
		if (value === null) return T_NULL;
		if (value instanceof Array) return T_ARRAY;
		switch (typeof(value)) {
			case 'undefined': return T_UNDEFINED;
			case 'boolean': return T_BOOLEAN;
			case 'number': return T_NUMBER;
			case 'string': return T_STRING;
			case 'function': return T_FUNCTION;
			case 'object': return T_OBJECT;
		}
	}

	function forEachAsync(list, iterator, ret) {
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
	}

	/**
	 * Generates unique identifier based on UNIX timestamp.
	 * @param {string} prefix Prepend generated value.
	 * @return {string} Unique identifier.
	 */
	function uniqueId(prefix) {
		if (!isString(prefix)) prefix = '';
		var partOne = new Date().getTime();
		if (partOne > UID_TIME_LAST) UID_TIME_DIFF = 0;
		else partOne += (++UID_TIME_DIFF);
		UID_TIME_LAST = partOne;
		return (prefix + partOne.toString(36) +
			(1 + Math.floor((Math.random()*32767))).toString(36) +
			(1 + Math.floor((Math.random()*32767))).toString(36)
		);
	}

	/**
	 * Parses URI according to RFC3986.
	 * @param {string} uri URI to parse.
	 * @return {Object} consists of URI parts.
	 */
	function URIParse(uri) {
		var result = uri.match(URL_PARSER_REGEXP);
		return {
			'scheme': (result[1] || ''),
			'authority': (result[2] || ''),
			'path': (result[3] || ''),
			'query': (result[4] || ''),
			'fragment': (result[5] || '')
		};
	}

	/**
	 * Resolves a relative URI to a base URI, returning an absolute URI.
	 * @param {string} relative Relative URI.
	 * @param {string} base Base URI to resolve it to.
	 * @param {string} urlArgs Additional arguments for resolved url.
	 * @return {string} Absolute URI.
	 */
	function URIResolve(uri, base, urlArgs) {
		var relUri = URIParse(uri);
		var baseUri = URIParse(base);
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
	}

	function URIParseQuery(query) {
		var result = {};
		if (!isString(query)) return {};
		var query = query.split('&');
		var frag, length = query.length;
		for (var c = 0; c < length; c++) {
			frag = query[c].split('=', 2);
			result[frag[0]] = frag[1];
		}
		return result;
	}

	function getEnvType() {
		if (ENV_TYPE !== null) return ENV_TYPE;
		return (typeof process  !== 'undefined' && (ENV_TYPE = 'node') ||
			typeof Packages !== 'undefined' && (ENV_TYPE = 'rhino') ||
			typeof window !== 'undefined' && (ENV_TYPE = 'browser') ||
			(ENV_TYPE = 'unknown'));
	}

	function getEnvInfo() {
		if (ENV_INFO !== null) return ENV_INFO;
		var envType = getEnvType();
		if (envType === 'node') return (ENV_INFO = process.versions);
		if (envType === 'browser') return (ENV_INFO = window.navigator.userAgent);
		if (envType === 'rhino') {
			var System = java.lang.System;
			return (ENV_INFO = {
				'os.arch': String(System.getProperty('os.arch')),
				'os.name': String(System.getProperty('os.name')),
				'os.version': String(System.getProperty('os.version')),
				'java.vendor': String(System.getProperty('java.vendor')),
				'java.version': String(System.getProperty('java.version')),
				'java.vendor.url': String(System.getProperty('java.vendor.url'))
			});
		}
	}

	return {
		T_UNDEFINED: T_UNDEFINED,
		T_NULL: T_NULL,
		T_BOOLEAN: T_BOOLEAN,
		T_NUMBER: T_NUMBER,
		T_STRING: T_STRING,
		T_FUNCTION: T_FUNCTION,
		T_ARRAY: T_ARRAY,
		T_OBJECT: T_OBJECT,
		isUndefined: isUndefined,
		isNull: isNull,
		isBoolean: isBoolean,
		isNumber: isNumber,
		isString: isString,
		isArray: isArray,
		isObject: isObject,
		isFunction: isFunction,
		isNumeric: isNumeric,
		isDOMElement: isDOMElement,

		getBaseType: getBaseType,
		uniqueId: uniqueId,

		getEnvType: getEnvType,
		getEnvInfo: getEnvInfo,

		forEachAsync: forEachAsync,

		uri: {
			parse: URIParse,
			resolve: URIResolve,
			parseQuery: URIParseQuery
		}
	};

});