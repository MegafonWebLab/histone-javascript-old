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

	function onResponse(requestObj, success, fail, requestProps, isJSONP, response) {
		if (response.statusCode > 300 &&
			response.statusCode < 400 && response.headers.location) {
			var toURI = Utils.uri.parse(response.headers.location);
			if (!toURI.authority) toURI.authority = requestObj.authority;
			return NodeDriver(
				(toURI.scheme ? toURI.scheme + '://' : '') +
				(toURI.authority ? toURI.authority : '') +
				(toURI.path ? toURI.path : '') +
				(toURI.query ? '?' + toURI.query : '') +
				(toURI.fragment ? '#' + toURI.fragment : ''),
				success, fail, requestProps, isJSONP
			);
		}
		var data = '';
		response.on('end', function() { success(data); });
		response.on('data', function(chunk) { data += chunk; });
	}

	function doHTTPRequest(requestObj, success, fail, requestProps, isJSONP) {
		var postData = '', query = requestObj.query;
		if (!Utils.isObject(requestProps)) requestProps = {};

		if (isJSONP) {
			if (query) query += '&';
			query += 'callback=';
			query += Utils.uniqueId('callback');
		}

		if (query) query = ('?' + query);

		var requestOptions = {
			host: requestObj.authority,
			path: requestObj.path + query,
			method: (
				requestProps.hasOwnProperty('method') &&
				Utils.isString(requestProps.method) &&
				requestProps.method || 'GET'
			),
			headers: (
				requestProps.hasOwnProperty('headers') &&
				Utils.isObject(requestProps.headers) &&
				requestProps.headers || {}
			)
		};

		if (requestProps.hasOwnProperty('data') &&
			!Utils.isUndefined(requestProps.data)) {
			postData = requestProps.data;
			if (Utils.isObject(postData)) {
				var postFields = [];
				for (var fieldName in postData) {
					if (postData.hasOwnProperty(fieldName)) {
						postFields.push(fieldName + '=' +
							encodeURIComponent(postData[fieldName])
						);
					}
				}
				postData = postFields.join('&');
				requestOptions.headers['Content-type'] = (
					'application/x-www-form-urlencoded'
				);
			} else postData = String(postData);
		}

		var request = (
			requestObj.scheme === 'http' && (
			HTTPModule = HTTPModule || require('http')
		) || requestObj.scheme === 'https' && (
			HTTPSModule = HTTPSModule || require('https')
		)).request(requestOptions, Function.prototype.bind.apply(
			onResponse, Array.prototype.concat.apply(this, arguments)
		));

		request.on('error', function(error) { fail(); });
		request.write(postData);
		request.end();
	}

	function NodeDriver(requestURI, success, fail, requestProps, isJSONP) {
		var requestObj = Utils.uri.parse(requestURI);
		try {
			if (requestObj.scheme === 'http' ||
				requestObj.scheme === 'https') doHTTPRequest(
				requestObj, success, fail, requestProps, isJSONP
			); else if (requestObj.scheme === '') {
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