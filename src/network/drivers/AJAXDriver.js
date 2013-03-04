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

	var XMLHttpFactory = null;

	var XMLHttpFactories = [
		function() { return new XMLHttpRequest(); },
		function() { return new ActiveXObject('Msxml2.XMLHTTP'); },
		function() { return new ActiveXObject('Msxml3.XMLHTTP'); },
		function() { return new ActiveXObject('Microsoft.XMLHTTP'); }
	];

	function createXMLHTTPObject() {
		if (XMLHttpFactory) return XMLHttpFactory;
		for (var c = 0; c < XMLHttpFactories.length; c++) {
			try { return XMLHttpFactory = XMLHttpFactories[c](); }
			catch (exception) {}
		}
	}

	function doXMLHTTPRequest(requestURI, ret, requestProps) {
		var request = createXMLHTTPObject();
		if (!request) return ret();
		try {
			request.open(requestProps.method, requestURI, requestProps.async);
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
				if (status > 399 && status < 600) return ret();
				ret(request.responseText);
			};
			request.send(requestProps.data);
		} catch (exception) { ret(); }
	}

	function removeCallback(callbackId) {
		delete window[callbackId];
		var scriptElement = document.getElementById(callbackId);
		scriptElement.parentNode.removeChild(scriptElement);
	}

	function doJSONPRequest(requestURI, ret, requestProps) {
		var requestURI = Utils.uri.parse(requestURI);
		var query = Utils.uri.parseQuery(requestURI.query);
		if (!query.callback) query.callback = Utils.uniqueId('callback')
		requestURI.query = Utils.uri.formatQuery(query);
		requestURI = Utils.uri.format(requestURI);
		var callbackId = query.callback;
		var cleanup = removeCallback.bind(this, callbackId);
		window[callbackId] = function(response) { cleanup(); ret(response); };
		var scriptElement = document.createElement('script');
		scriptElement.setAttribute('id', callbackId);
		scriptElement.setAttribute('src', requestURI);
		scriptElement.setAttribute('type', 'text/javascript');
		scriptElement.onerror = function() { cleanup(); ret(); };
		document.getElementsByTagName('head')[0].appendChild(scriptElement);
	}

	return function(requestURI, ret, requestProps, isJSONP) {
		if (!isJSONP) doXMLHTTPRequest(requestURI, ret, requestProps);
		else doJSONPRequest(requestURI, ret, requestProps);
	};

});