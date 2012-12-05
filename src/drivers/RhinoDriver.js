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

	function doHTTPRequest(requestURI, success, fail, requestProps) {

		var url = new Java.URL(requestURI);
		var connection = url.openConnection();

		connection.setDoOutput(true);
		connection.setDoInput(true);

		connection.setInstanceFollowRedirects(false);
		connection.setRequestMethod(requestProps.method);

		var requestHeaders = requestProps.headers;
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

			doHTTPRequest(requestURI, success, fail, requestProps);

		} else if (requestProtocol === '') {

			var data = readFile(requestURI);
			success(data);

		} else fail();

	};

});