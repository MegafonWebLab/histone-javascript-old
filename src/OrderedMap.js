/**
 * OrderedMap.js - Histone template engine.
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

define(['./Utils.js'], function(Utils) {

	function indexOf(array, start) {
		if (Array.prototype.indexOf) {
			return array.indexOf(start);
		}
		for (var i = (start || 0), j = this.length; i < j; i++) {
			if (this[i] === array) { return i; }
		}
		return -1;
	}

	var OrderedMap = function() {

		var maxIndex = -1;
		var keys = [], values = [];

		this.concat = function(value) {

			if (!(value instanceof this.constructor)) {
				return this;
			}

			maxIndex = 0;
			var nKeys = [], nVals = [];
			var cKeys = value.keys();
			var cValues = value.values();

			for (var c = 0; c < values.length; c++) {
				var key = keys[c];
				if (Utils.isNumeric(key)) {
					nKeys.push(maxIndex++);
				} else nKeys.push(key);
				nVals.push(values[c]);
			}

			for (var c = 0; c < cValues.length; c++) {
				var key = cKeys[c];
				if (Utils.isNumeric(key)) {
					nKeys.push(maxIndex++);
				} else nKeys.push(key);
				nVals.push(cValues[c]);
			}

			maxIndex--;
			keys = nKeys;
			values = nVals;

			return this;
		};

		this.length = function() {
			return values.length;
		};

		this.keys = function() {
			return keys;
		};

		this.values = function() {
			return values;
		};

		this.hasKey = function(key) {
			if (!Utils.isString(key) &&
				!Utils.isNumber(key)) return false;
			var key = String(key);
			return indexOf(keys, key) !== -1;
		};

		this.join = function(separator) {
			if (!Utils.isString(separator)) separator = '';
			return values.join(separator);
		};

		this.get = function(key) {
			if (!Utils.isString(key) &&
				!Utils.isNumber(key)) return;
			var key = String(key);
			var keyIndex = indexOf(keys, key);
			if (keyIndex === -1) return;
			return values[keyIndex];
		};

		this.set = function(key, value) {
			if (Utils.isString(key) || Utils.isNumber(key)) {
				var key = String(key);
				var keyIndex = indexOf(keys, key);
				if (keyIndex === -1) {
					if (Utils.isNumeric(key) &&
						key > maxIndex) {
						maxIndex = parseInt(key);
					}
					keys.push(key);
					values.push(value);
				} else values[keyIndex] = value;
			} else {
				key = String(++maxIndex);
				keys.push(key);
				values.push(value);
			}
			return this;
		};

		this.remove = function(key) {
			if (!Utils.isString(key) &&
				!Utils.isNumber(key)) return this;
			var key = String(key);
			var keyIndex = indexOf(keys, key);
			if (keyIndex === -1) return this;
			keys.splice(keyIndex, 1);
			values.splice(keyIndex, 1);
			return this;
		},

		this.clone = function() {
			var key, value, i;
			var length = keys.length;
			var result = new OrderedMap();
			for (i = 0; i < length; i++) {
				key = keys[i];
				value = values[i];
				result.set(key, value);
			}
			return result;
		};

		this.slice = function(offset, length) {
			var arrLen = values.length;
			if (!Utils.isNumber(offset)) offset = 0;
			if (offset < 0) offset = arrLen + offset;
			if (offset < 0) offset = 0;
			if (offset >= arrLen) {
				keys = [];
				values = [];
				return this;
			}
			if (!Utils.isNumber(length)) length = 0;
			if (length === 0) length = arrLen - offset;
			if (length < 0) length = arrLen - offset + length;
			if (length <= 0) {
				keys = [];
				values = [];
				return this;
			}
			keys = keys.slice(offset, offset + length);
			values = values.slice(offset, offset + length);
			return this;
		};


		this.toObject = function() {
			var result, length = keys.length;
			var i, key, value = 0, isArray = true;
			for (i = 0; i < length; i++) {
				key = keys[i];
				if (!Utils.isNumeric(key) ||
					value !== parseInt(key)) {
					isArray = false;
					break;
				}
				value++;
			}
			result = (isArray ? [] : {});
			for (i = 0; i < length; i++) {
				value = values[i];
				if (value instanceof
					this.constructor) {
					value = value.toObject();
				}
				if (!isArray) {
					key = keys[i];
					result[key] = value;
				} else result.push(value);
			}
			return result;
		};

	};

	return OrderedMap;

});