/**
 * Network.js - Histone template engine.
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
	'../Utils', '../OrderedMap',
	'drivers/AJAXDriver', 'drivers/NodeDriver'
], function(Utils, OrderedMap, AJAXDriver, NodeDriver) {

	var resourceCache = {};

	var envType = Utils.getEnvType();

	var NetworkDriver = (
		envType === 'node' && NodeDriver ||
		envType === 'browser' && AJAXDriver
	);

	function filterRequestHeaders(requestHeaders) {
		var headers = {}, name, value;
		for (name in requestHeaders) {
			value = name.toLowerCase();
			if (value.substr(0, 4) === 'sec-') continue;
			if (value.substr(0, 6) === 'proxy-') continue;
			switch (value) {
				case 'accept-charset':
				case 'accept-encoding':
				case 'access-control-request-headers':
				case 'access-control-request-method':
				case 'connection':
				case 'content-length':
				case 'cookie':
				case 'cookie2':
				case 'content-transfer-encoding':
				case 'date':
				case 'expect':
				case 'host':
				case 'keep-alive':
				case 'origin':
				case 'referer':
				case 'te':
				case 'trailer':
				case 'transfer-encoding':
				case 'upgrade':
				case 'user-agent':
				case 'via': break;
				default:
					value = requestHeaders[name];
					if (!Utils.isUndefined(value)) {
						headers[name] = String(value);
					}
			}
		}
		return headers;
	}

	function loadResource(requestURI, baseURI, ret, requestProps, isJSONP) {
		var resourceURI = Utils.uri.resolve(requestURI, baseURI);
		// THINK HOW WE CAN IMPROVE CACHE (possibly use serialized request as a key)
		if (!resourceCache.hasOwnProperty(resourceURI)) {

			if (requestProps instanceof OrderedMap) {
				requestProps = {
					data: requestProps.get('data'),
					method: Share.internal2js(requestProps.get('method')),
					headers: Share.internal2js(requestProps.get('headers'))
				};
			} else if (!Utils.isMap(requestProps)) {
				requestProps = {};
			}

			var requestMethod = requestProps.method = (
				requestProps.hasOwnProperty('method') &&
				Utils.isString(requestProps.method) &&
				requestProps.method.toUpperCase() || 'GET'
			);

			if (requestMethod !== 'GET' &&
				requestMethod !== 'POST') {
				return ret(undefined, resourceURI);
			}

			requestProps.headers = (
				requestProps.hasOwnProperty('headers') &&
				Utils.isMap(requestProps.headers) &&
				filterRequestHeaders(requestProps.headers) || {}
			);

			if (requestMethod === 'POST' &&
				requestProps.hasOwnProperty('data') &&
				!Utils.isUndefined(requestProps.data)) {
				var requestData = requestProps.data;
				if (Utils.isObject(requestData)) {
					if (requestData instanceof OrderedMap) {
						requestProps.data = requestData.toQueryString(
							null, null, Share.nodeToString
						);
					} else if (Utils.isArray(requestData)) {
						var resultArr, key, value;
						var length = requestData.length;
						for (key = 0; key < length; key++) {
							value = Share.nodeToString(requestData[key]);
							value = encodeURIComponent(value);
							resultArr.push(key + '=' + value);
						}
						requestProps.data = resultArr.join('&');
					} else {
						var resultArr, key, value;
						for (key in requestData) {
							value = Share.nodeToString(requestData[key]);
							value = encodeURIComponent(value);
							resultArr.push(key + '=' + value);
						}
						requestProps.data = resultArr.join('&');
					}
					requestProps.headers['Content-type'] = (
						'application/x-www-form-urlencoded'
					);
				} else requestProps.data = Share.nodeToString(requestData);
			} else requestProps.data = '';

			NetworkDriver(resourceURI, function(resourceData) {
				resourceData = ret(resourceData, resourceURI);
				if (!Utils.isUndefined(resourceData)) {
					resourceCache[resourceURI] = resourceData;
				}
			}, function() {
				ret(undefined, resourceURI);
			}, requestProps, isJSONP);

		} else ret(resourceCache[resourceURI], resourceURI);
	}

	return loadResource;

});