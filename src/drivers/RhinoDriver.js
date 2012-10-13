define(['../Utils.js'], function(Utils) {

	return function(requestURI, success, fail, requestProps, isJSONP) {
		var requestObj = Utils.uri.parse(requestURI);
		try {
			if (requestObj.scheme === 'http' ||
				requestObj.scheme === 'https') {
				var data = readUrl(requestURI);
				success(data, requestURI);
			} else if (requestObj.scheme === '') {
				var data = readFile(requestURI);
				success(data, requestURI);
			} else fail();
		} catch (exception) { fail(); }
	};

});