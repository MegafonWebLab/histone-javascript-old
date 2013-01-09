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

	function readFromStream(stream) {
		var responseBody = '';
		var streamReader = new Java.InputStreamReader(stream);
		var bufferedReader = new Java.BufferedReader(streamReader);
		var line = bufferedReader.readLine();
		while (line !== null) {
			responseBody += String(line);
			line = bufferedReader.readLine();
		}
		bufferedReader.close();
		return responseBody;
	}

	function writeToStream(stream, data) {
		var writer = new Java.DataOutputStream(stream);
		writer.writeBytes(data);
		writer.flush();
		writer.close();
	}

	function doHTTPRequest(requestObj, success, fail, requestProps) {

		try {
			var requestURI = Utils.uri.format(requestObj);
			var url = new Java.URL(requestURI);
			var connection = url.openConnection();
			connection.setDoInput(true);
			connection.setUseCaches(false);
			connection.setInstanceFollowRedirects(false);
			connection.setRequestMethod(requestProps.method);

			var requestHeaders = requestProps.headers;
			connection.setRequestProperty('content-type', '');
			for (var key in requestHeaders) {
				connection.setRequestProperty(
					key, requestHeaders[key]
				);
			}

			if (requestProps.data.length) {
				connection.setDoOutput(true);
				writeToStream(
					connection.getOutputStream(),
					requestProps.data
				);
			}

			var responseCode = connection.getResponseCode();

			// successful response code
			if (responseCode === 200) {
				var inputStream = connection.getInputStream();
				var responseData = readFromStream(inputStream);
				connection.disconnect();
				return success(responseData);
			}

			connection.disconnect();

			// redirect response codes
			if (responseCode > 300 && responseCode < 400) {
				var location = connection.getHeaderField('location');
				if (location !== null) {
					location = Utils.uri.parse(location);
					if (!location.scheme)
						location.scheme = requestObj.scheme;
					if (!location.authority)
						location.authority = requestObj.authority;
					return doHTTPRequest(location, success, fail, requestProps);
				}
			}

			fail();

		} catch (exception) { fail(); }
	}

	return function(requestURI, success, fail, requestProps, isJSONP) {
		if (Java === null) Java = JavaImporter(
			java.net.URL,
			java.io.DataOutputStream,
			java.io.BufferedReader,
			java.io.InputStreamReader,
			javax.xml.bind.DatatypeConverter
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
			doHTTPRequest(requestObj, success, fail, requestProps);
		} else if (requestProtocol === 'data') {
			requestObj = Utils.uri.parseData(requestObj.path);
			if (requestObj.encoding === 'base64') {
				var requestData = requestObj.data;
				requestData = Java.DatatypeConverter.parseBase64Binary(requestData);
				requestData = String(new java.lang.String(requestData));
				success(requestData);
			} else fail();
		} else if (requestProtocol === '') {
			var data = readFile(requestURI);
			success(data);
		} else fail();

	};

});