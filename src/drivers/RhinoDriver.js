/**
 * RhinoDriver.js - Histone template engine.
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

	var Java = null;

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

	function getResponseBody(connection) {
		var responseBody = '';
		var inputStream = connection.getInputStream();
		var streamReader = new Java.InputStreamReader(inputStream);
		var bufferedReader = new Java.BufferedReader(streamReader);
		var chunk = bufferedReader.readLine();
		while (chunk !== null) {
			responseBody += chunk;
			chunk = bufferedReader.readLine();
		}
		bufferedReader.close();
		return responseBody;
	}

	function doHTTPRequest(requestURI, success, fail, requestProps, isJSONP) {
		if (!Utils.isObject(requestProps)) requestProps = {};

		var requestMethod = (
			requestProps.hasOwnProperty('method') &&
			Utils.isString(requestProps.method) &&
			requestProps.method.toUpperCase() || 'GET'
		);

		var requestHeaders = filterRequestHeaders(
			requestProps.hasOwnProperty('headers') &&
			Utils.isObject(requestProps.headers) &&
			requestProps.headers || {}
		);

		var url = new Java.URL(requestURI);
		var connection = url.openConnection();

		connection.setDoOutput(true);
		connection.setDoInput(true);

		connection.setInstanceFollowRedirects(false);
		connection.setRequestMethod(requestMethod);

		for (var key in requestHeaders)
			connection.setRequestProperty(key, requestHeaders[key]);

		connection.setUseCaches (false);

		connection.connect();

		// var wr = new Java.DataOutputStream(connection.getOutputStream());
		// wr.writeBytes(urlParameters);
		// wr.flush();
		// wr.close();

		success(getResponseBody(connection));
		connection.disconnect();
	}

	return function(requestURI, success, fail, requestProps, isJSONP) {

		if (Java === null) Java = JavaImporter(
			java.net.URL,
			java.io.DataOutputStream,
			java.io.BufferedReader,
			java.io.InputStreamReader
		);

		var requestObj = Utils.uri.parse(requestURI);

		try {
			if (requestObj.scheme === 'http' ||
				requestObj.scheme === 'https') doHTTPRequest(
				requestURI, success, fail, requestProps, isJSONP
			); else if (requestObj.scheme === '') {
				var data = readFile(requestURI);
				success(data);
			} else fail();
		} catch (exception) { fail(); }
	};

});