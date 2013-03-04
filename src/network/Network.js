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
	'../Utils', '../OrderedMap', '../Share',
	'ResourceLoader', 'drivers/AJAXDriver', 'drivers/NodeDriver'
], function(Utils, OrderedMap, Share, ResourceLoader, AJAXDriver, NodeDriver) {

	var resourceCache = {};
	var envType = Utils.getEnvType();

	function decodeDataURI(dataURI) {
		var uriObj = Utils.uri.parseData(dataURI);
		if (!uriObj) return;
		var requestData = uriObj.data;
		try {
			if (uriObj.encoding === 'base64')
				return Utils.base64decode(requestData);
			return decodeURIComponent(requestData);
		} catch (exception) {}
	}

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

	function filterRequestProps(requestProps) {

		if (requestProps instanceof OrderedMap) {
			requestProps = {
				data: requestProps.get('data'),
				method: Share.internal2js(requestProps.get('method')),
				headers: Share.internal2js(requestProps.get('headers'))
			};
		}

		else if (!Utils.isMap(requestProps))
			requestProps = {};

		var requestMethod = requestProps.method = (
			requestProps.hasOwnProperty('method') &&
			Utils.isString(requestProps.method) &&
			requestProps.method.toUpperCase() || 'GET'
		);

		if (requestMethod !== 'GET' && requestMethod !== 'POST')
			requestMethod = requestProps.method = 'GET';

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

		return requestProps;
	}

	function loadResource(requestURI, baseURI, ret, requestProps, isJSONP) {
		var requestURI = Utils.uri.resolve(requestURI, baseURI);
		requestURI = Utils.string.trimLeft(requestURI);
		if (Utils.string.startsWith(requestURI, 'data:', true))
			return ret(decodeDataURI(requestURI));
		var requestProps = filterRequestProps(requestProps);
		var requestHash = [requestURI, requestProps];
		requestHash = JSON.stringify(requestHash);
		if (!requestProps.hasOwnProperty('async'))
			requestProps.async = true;
		if (!requestProps.hasOwnProperty('cache'))
			requestProps.cache = true;
		if (!requestProps.cache) {
			requestURI = Utils.uri.parse(requestURI);
			var query = Utils.uri.parseQuery(requestURI.query);
			query['histone.nocache'] = new Date().getTime();
			requestURI.query = Utils.uri.formatQuery(query);
			requestURI = Utils.uri.format(requestURI);
		}
		ResourceLoader(requestHash, function(resourceData) {
			ret(resourceData, requestURI, requestHash);
		}, function(ret) {
			switch (envType) {
				case 'nodejs': return NodeDriver(requestURI, ret, requestProps, isJSONP);
				case 'browser': return AJAXDriver(requestURI, ret, requestProps, isJSONP);
				default: ret();
			}
		});
	}

	return loadResource;

});