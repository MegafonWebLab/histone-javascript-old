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
	var FILE_TYPE_REGEXP = /.+\.([^\.]+)$/;
	var URL_PARSER_REGEXP = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;
	var ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function getbyte64(s, i) {
		var ch = s.charAt(i);
		var idx = ALPHA.indexOf(ch);
		if (idx === -1) throw ('illegal `' + ch + '` character');
		return idx;
	}

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
	 * Returns true if the value is map.
	 * @param {*} value Value to check.
	 * @return {boolean} Returns true if the value is map.
	 */
	function isMap(value) {
		return (value instanceof Object &&
			!(value instanceof Array));
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
		if (!(list instanceof Object)) return ret();
		var keys, key, length, last;
		var i = -1, calls = 0, looping = false;
		if (list instanceof Array) {
			length = list.length;
		} else {
			keys = Object.keys(list);
			length = keys.length;
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

	function base64decode(value) {
		var result = [];
		var pads = 0, i, b10;
		var value = String(value);
		var length = value.length;

		if (!length) return value;
		if (length % 4) throw ('incorrect padding');

		if (value.charAt(length - 1) === '=') {
			pads = 1;
			if (value.charAt(length - 2) === '=') pads = 2;
			length -= 4;
		}

		for (i = 0; i < length; i += 4) {
			b10 = getbyte64(value, i) << 18;
			b10 |= getbyte64(value, i + 1) << 12;
			b10 |= getbyte64(value, i + 2) << 6;
			b10 |= getbyte64(value, i + 3);
			result.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));
		}

		if (pads) {
			b10 = getbyte64(value, i) << 18;
			b10 |= getbyte64(value, i + 1) << 12;
			result.push(String.fromCharCode(b10 >> 16));
			if (pads === 1) {
				b10 |= getbyte64(value, i + 2) << 6;
				result.push(String.fromCharCode((b10 >> 8) & 0xff));
			}
		}

		return result.join('');
	}

	function string_trimLeft(value) {
		if (!isString(value)) return '';
		return value.replace(/^\s+/, '');
	}

	function string_trimRight(value) {
		if (!isString(value)) return '';
		return value.replace(/\s+$/, '');
	}

	function string_startsWith(value, search, ignoreCase) {
		if (!isString(value)) return false;
		if (!isString(search)) return false;
		var fragment = value.substr(0, search.length);
		if (ignoreCase) {
			search = search.toLowerCase();
			fragment = fragment.toLowerCase();
		}
		return (search === fragment);
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
	function uri_parse(uri) {
		var result = uri.match(URL_PARSER_REGEXP);
		var scheme = (result[1] || '');
		var authority = (result[2] || '');
		var path = (result[3] || '');
		var fileName = (path.split('/').pop());
		var fileType = fileName.match(FILE_TYPE_REGEXP);
		fileType = (fileType && fileType[1] || '');
		return {
			scheme: scheme, authority: authority,
			path: path, fileName: fileName, fileType: fileType,
			query: (result[4] || ''), fragment: (result[5] || '')
		};
	}

	function uri_parseData(dataURI) {
		if (!isString(dataURI)) return;
		if (!string_startsWith(dataURI, 'data:', true)) return;
		var keyValue = dataURI.substr(5).split(',');
		if (keyValue.length < 2) return;
		dataURI = keyValue.shift().split(';');
		var result = {
			encoding: '',
			data: keyValue.join(','),
			params: {charset: 'US-ASCII'},
			type: dataURI.shift() || 'text/plain'
		};
		while (dataURI.length) {
			keyValue = dataURI.shift().split('=');
			if (isString(keyValue[1]))
				result.params[keyValue[0]] = keyValue[1];
			else result.encoding = keyValue[0];
		}
		return result;
	}

	function uri_parseQuery(query) {
		var result = {};
		if (!isString(query)) return {};
		query.replace(new RegExp('([^?=&]+)(=([^&]*))?', 'g'),
			function($0, $1, $2, $3) { result[$1] = $3; });
		return result;
	}

	function uri_format(uri) {
		return ((uri.scheme ? uri.scheme + '://' : '') +
			(uri.authority ? uri.authority : '') +
			(uri.path ? uri.path : '') +
			(uri.query ? '?' + uri.query : '') +
			(uri.fragment ? '#' + uri.fragment : ''));
	}

	function uri_formatQuery(query) {
		var queryArr = [], key;
		if (!isMap(query)) return '';
		for (key in query) {
			if (!query.hasOwnProperty(key)) continue;
			queryArr.push(key + '=' + query[key]);
		}
		return queryArr.join('&');
	}

	/**
	 * Resolves a relative URI to a base URI, returning an absolute URI.
	 * @param {string} relative Relative URI.
	 * @param {string} base Base URI to resolve it to.
	 * @param {string} urlArgs Additional arguments for resolved url.
	 * @return {string} Absolute URI.
	 */
	function uri_resolve(uri, base, urlArgs) {
		var relUri = uri_parse(uri);
		var baseUri = uri_parse(base);
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

	function getEnvType() {
		if (ENV_TYPE !== null) return ENV_TYPE;
		return (typeof process  === 'object' && (ENV_TYPE = 'nodejs') ||
			typeof window !== 'undefined' && (ENV_TYPE = 'browser') ||
			(ENV_TYPE = 'unknown')
		);
	}

	function getEnvInfo() {
		if (ENV_INFO !== null) return ENV_INFO;
		var envType = getEnvType();
		if (envType === 'nodejs') return (ENV_INFO = process.versions);
		if (envType === 'browser') return (ENV_INFO = window.navigator.userAgent);
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
		isMap: isMap,
		isFunction: isFunction,
		isNumeric: isNumeric,
		isDOMElement: isDOMElement,

		getBaseType: getBaseType,
		uniqueId: uniqueId,
		getEnvType: getEnvType,
		getEnvInfo: getEnvInfo,
		forEachAsync: forEachAsync,
		base64decode: base64decode,

		string: {
			trimLeft: string_trimLeft,
			trimRight: string_trimRight,
			startsWith: string_startsWith
		},

		uri: {
			parse: uri_parse,
			format: uri_format,
			resolve: uri_resolve,
			parseData: uri_parseData,
			parseQuery: uri_parseQuery,
			formatQuery: uri_formatQuery
		}
	};

});