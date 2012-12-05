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

	var URL = null;
	var FSModule = null;
	var HTTPModule = null;
	var HTTPSModule = null;

	function doHTTPRequest(requestObj, success, fail, requestProps) {
		var request = (
			requestObj.protocol === 'http:' && (
			HTTPModule = HTTPModule || require('http')
		) || requestObj.protocol === 'https:' && (
			HTTPSModule = HTTPSModule || require('https')
		)).request({
			host: requestObj.hostname,
			port: requestObj.port,
			path: requestObj.path,
			method: requestProps.method,
			headers: requestProps.headers
		}, function(response) {

			if (response.statusCode > 300 &&
				response.statusCode < 400 && response.headers.location) {
				var toURI = URL.parse(response.headers.location);
				if (!toURI.port) toURI.port = requestObj.port;
				if (!toURI.host) toURI.host = requestObj.host;
				if (!toURI.hostname) toURI.hostname = requestObj.hostname;
				if (!toURI.protocol) toURI.protocol = requestObj.protocol;
				return doHTTPRequest(toURI, success, fail, requestProps);
			}

			var data = '';
			response.on('end', function() { success(data); });
			response.on('data', function(chunk) { data += chunk; });
		});

		request.on('error', function(error) { fail(); });
		if (requestProps.data) request.write(requestProps.data);
		request.end();
	}

	function NodeDriver(requestURI, success, fail, requestProps, isJSONP) {

		if (!URL) URL = require('url');
		var requestObj = Utils.uri.parse(requestURI);
		var requestProtocol = (requestObj.scheme || '');

		if (requestProtocol === 'http' || requestProtocol === 'https') {
			if (isJSONP) {
				var query = Utils.uri.parseQuery(requestObj.query);
				if (!query.hasOwnProperty('callback')) {
					query['callback'] = Utils.uniqueId('callback');
					requestObj.query = Utils.uri.formatQuery(query);
				}
			}
			requestURI = Utils.uri.format(requestObj);
			requestObj = URL.parse(requestURI);
			doHTTPRequest(requestObj, success, fail, requestProps);
		} else if (requestProtocol === '') {
			FSModule = (FSModule || require('fs'));
			FSModule.readFile(requestURI, function(error, data) {
				if (error) return fail();
				success(data.toString());
			});
		} else fail();
	}

	return NodeDriver;

});