/**
 * AJAXDriver.js - Histone template engine.
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

define(['../../Utils'], function(Utils) {

	var XMLHttpFactories = [
		function () {return new XMLHttpRequest()},
		function () {return new ActiveXObject('Msxml2.XMLHTTP')},
		function () {return new ActiveXObject('Msxml3.XMLHTTP')},
		function () {return new ActiveXObject('Microsoft.XMLHTTP')}
	];

	function createXMLHTTPObject() {
		var xmlhttp = false;
		for (var c = 0; c < XMLHttpFactories.length; c++) {
			try {
				xmlhttp = XMLHttpFactories[c]();
			} catch (e) { continue; }
			break;
		}
		return xmlhttp;
	}

	function doRequest(requestURI, success, fail, requestProps) {
		var request = createXMLHTTPObject();
		if (!request) return fail();

		var postData = null;

		try {
			request.open(requestProps.method, requestURI, true);

			var requestHeaders = requestProps.headers;
			for (var headerName in requestHeaders) {
				if (requestHeaders.hasOwnProperty(headerName)) {
					request.setRequestHeader(headerName,
						requestHeaders[headerName]
					);
				}
			}

			request.onreadystatechange = function() {
				if (request.readyState !== 4) return;
				var status = request.status;
				if (status > 399 && status < 600) return fail();
				success(request.responseText);
			};

			request.send(requestProps.data);

		} catch (e) { fail(); }
	}

	function removeCallback(callbackId) {
		delete window[callbackId];
		var scriptElement = document.getElementById(callbackId);
		scriptElement.parentNode.removeChild(scriptElement);
	}

	function doJSONPRequest(requestURI, success, fail, requestProps) {

		var requestQuery = [];
		var requestURI = Utils.uri.parse(requestURI);
		var requestParams = Utils.uri.parseQuery(requestURI.query);
		var callbackId = Utils.uniqueId('callback');
		requestParams.callback = callbackId;

		for (var paramName in requestParams) {
			if (requestParams.hasOwnProperty(paramName)) {
				requestQuery.push(paramName +
					'=' + requestParams[paramName]
				);
			}
		}

		requestURI = (
			(requestURI.scheme ? requestURI.scheme + '://' : '') +
			(requestURI.authority ? requestURI.authority : '') +
			(requestURI.path ? requestURI.path : '') +
			(requestQuery.length ? '?' + requestQuery.join('&') : '') +
			(requestURI.fragment ? '#' + requestURI.fragment : '')
		);

		var cleanup = removeCallback.bind(this, callbackId);

		window[callbackId] = function(response) {
			cleanup();
			success(response);
		};


		var scriptElement = document.createElement('script');
		scriptElement.setAttribute('id', callbackId);
		scriptElement.setAttribute('src', requestURI);
		scriptElement.setAttribute('type', 'text/javascript');

		scriptElement.onerror = function() {
			cleanup();
			fail();
		};

		// scriptElement.onerror =
		// scriptElement.onreadystatechange =
		// removeCallback.bind(this, callbackId);

		document.getElementsByTagName('head')[0].appendChild(scriptElement);
	}

	return function(requestURI, success, fail, requestProps, isJSONP) {
		var requestObj = Utils.uri.parse(requestURI);
		if (requestObj.scheme === 'data') {
			requestObj = Utils.uri.parseData(requestObj.path);
			if (requestObj.encoding === 'base64') {
				var requestData = requestObj.data;
				requestData = atob(requestData);
				success(requestData);
			} else fail();
		}
		else if (!isJSONP) doRequest(requestURI, success, fail, requestProps);
		else doJSONPRequest(requestURI, success, fail, requestProps);
	};

});