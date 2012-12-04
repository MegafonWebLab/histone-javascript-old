/**
 * NodeDriver.js - Histone template engine.
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

define(['../Utils'], function(Utils) {

	var FSModule = null;
	var HTTPModule = null;
	var HTTPSModule = null;
	var URL = (Utils.getEnvType() === 'node' && require('url'));

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

	function onResponse(requestObj, success, fail, requestProps, isJSONP, response) {
		if (response.statusCode > 300 &&
			response.statusCode < 400 && response.headers.location) {
			var toURI = URL.parse(response.headers.location);
			if (!toURI.host) toURI.host = requestObj.host;
			if (!toURI.protocol) toURI.protocol = requestObj.protocol;
			return NodeDriver(URL.format(toURI),
				success, fail, requestProps, isJSONP);
		}
		var data = '';
		response.on('end', function() { success(data); });
		response.on('data', function(chunk) { data += chunk; });
	}

	function doHTTPRequest(requestObj, success, fail, requestProps, isJSONP) {
		var postData = '', query = (requestObj.query || '');
		if (!Utils.isObject(requestProps)) requestProps = {};

		if (isJSONP && query.indexOf('callback=') === -1) {
			if (query) query += '&';
			query += 'callback=';
			query += Utils.uniqueId('callback');
		}

		if (query) query = ('?' + query);

		var requestMethod = (
			requestProps.hasOwnProperty('method') &&
			Utils.isString(requestProps.method) &&
			requestProps.method.toUpperCase() || 'GET'
		);

		var requestOptions = {

			host: requestObj.hostname,
			port: requestObj.port,
			path: requestObj.pathname + query,

			method: requestMethod,
			headers: filterRequestHeaders(
				requestProps.hasOwnProperty('headers') &&
				Utils.isObject(requestProps.headers) &&
				requestProps.headers || {}
			)
		};

		if (requestMethod !== 'GET' &&
			requestMethod !== 'HEAD' &&
			requestProps.hasOwnProperty('data') &&
			!Utils.isUndefined(requestProps.data)) {
			postData = requestProps.data;
			if (Utils.isObject(postData)) {
				// THIS IS NOT - TESTED / HAS TO BE REFACTORED
				// postData = Histone.Map.toQueryString(postData);
				requestOptions.headers['Content-type'] = (
					'application/x-www-form-urlencoded'
				);
			} else postData = String(postData);
		}

		var request = (
			requestObj.protocol === 'http:' && (
			HTTPModule = HTTPModule || require('http')
		) || requestObj.protocol === 'https:' && (
			HTTPSModule = HTTPSModule || require('https')
		)).request(requestOptions, Function.prototype.bind.apply(
			onResponse, Array.prototype.concat.apply(this, arguments)
		));

		request.on('error', function(error) { fail(); });
		request.write(postData);
		request.end();
	}

	function NodeDriver(requestURI, success, fail, requestProps, isJSONP) {
		var requestObj = URL.parse(requestURI);
		var requestProtocol = (requestObj.protocol || '');
		try {
			if (requestProtocol === 'http:' ||
				requestProtocol === 'https:') doHTTPRequest(
				requestObj, success, fail, requestProps, isJSONP
			); else if (requestProtocol === '') {
				FSModule = (FSModule || require('fs'));
				FSModule.readFile(requestURI, function(error, data) {
					if (error) return fail();
					success(data.toString());
				});
			} else fail();
		} catch (exception) { fail(); }
	}

	return NodeDriver;

});