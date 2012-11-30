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

	return function(requestURI, success, fail, requestProps, isJSONP) {
		var requestObj = Utils.uri.parse(requestURI);
		try {
			if (requestObj.scheme === 'http' ||
				requestObj.scheme === 'https') {
				var data = readUrl(requestURI);
				success(data);
			} else if (requestObj.scheme === '') {
				var data = readFile(requestURI);
				success(data);
			} else fail();
		} catch (exception) { fail(); }
	};

});