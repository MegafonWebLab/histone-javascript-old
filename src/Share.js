/**
 * Share.js - Histone template engine.
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
	'Utils', 'OrderedMap'
], function(Utils, OrderedMap) {

	function numberToString(value) {
		var value = String(value).toLowerCase();
		if (value.indexOf('e') === -1) return value;
		value = value.split('e');
		var numericPart = value[0];
		var exponentPart = value[1];
		var numericSign = numericPart[0];
		var exponentSign = exponentPart[0];
		if (numericSign === '+' || numericSign === '-') {
			numericPart = numericPart.substr(1);
		} else numericSign = '';
		if (exponentSign === '+' || exponentSign === '-') {
			exponentPart = exponentPart.substr(1);
		} else exponentSign = '+';
		var lDecPlaces, rDecPlaces;
		var decPos = numericPart.indexOf('.');
		if (decPos === -1) {
			rDecPlaces = 0;
			lDecPlaces = numericPart.length;
		} else {
			rDecPlaces = numericPart.substr(decPos + 1).length;
			lDecPlaces = numericPart.substr(0, decPos).length;
			numericPart = numericPart.replace(/\./g, '');
		}
		var numZeros = exponentPart - lDecPlaces;
		if (exponentSign === '+') numZeros = exponentPart - rDecPlaces;
		for (var zeros = '', c = 0; c < numZeros; c++) zeros += '0';
		return (
			exponentSign === '+' ?
			numericSign + numericPart + zeros :
			numericSign + '0.' + zeros + numericPart
		);
	}

	function mapToString(value) {
		var result = [], values = value.values();
		for (var c = 0; c < values.length; c++) {
			value = values[c];
			if (Utils.isUndefined(value)) continue;
			result.push(nodeToString(value));
		}
		return result.join(' ');
	}

	function js2internal(value) {
		if (Utils.isFunction(value)) return;
		if (!Utils.isObject(value)) return value;
		if (value instanceof OrderedMap) return value;
		var orderedMap = new OrderedMap();
		for (var key in value) {
			if (Object.prototype.hasOwnProperty.call(value, key)) {
				orderedMap.set(key, js2internal(value[key]));
			}
		}
		return orderedMap;
	}

	function internal2js(value) {
		if (!Utils.isObject(value)) return value;
		if (value instanceof OrderedMap) return value.toObject();
		if (Utils.isArray(value)) {
			var result = [];
			for (var key = 0; key < value.length; key++) {
				result.push(internal2js(value[key]));
			}
			return result;
		} else {
			var result = {};
			for (var key in value) {
				if (Object.prototype.hasOwnProperty.call(value, key)) {
					result[key] = internal2js(value[key]);
				}
			}
			return result;
		}
	}

	function nodeToBoolean(value) {
		switch (Utils.getBaseType(value)) {
			case Utils.T_BOOLEAN: return value;
			case Utils.T_FUNCTION: return true;
			case Utils.T_NUMBER: return (value !== 0);
			case Utils.T_STRING: return (value.length > 0);
			case Utils.T_OBJECT: return (value instanceof OrderedMap);
			default: return false;
		}
	}

	function nodeToString(value) {
		switch (Utils.getBaseType(value)) {
			case Utils.T_UNDEFINED:
			case Utils.T_FUNCTION: return '';
			case Utils.T_NULL:
			case Utils.T_STRING:
			case Utils.T_BOOLEAN: return String(value);
			case Utils.T_NUMBER: return numberToString(value);
		}
		if (Utils.isObject(value) &&
			value instanceof OrderedMap) {
			return mapToString(value);
		} else return '';
	}

	return {
		js2internal: js2internal,
		internal2js: internal2js,
		nodeToBoolean: nodeToBoolean,
		nodeToString: nodeToString
	};

});