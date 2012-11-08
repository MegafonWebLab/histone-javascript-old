define([
	'./Utils.js',
	'./drivers/AJAXDriver.js',
	'./drivers/NodeDriver.js',
	'./drivers/RhinoDriver.js'
], function(Utils, AJAXDriver, NodeDriver, RhinoDriver) {

	var envType = Utils.getEnvType();

	var NetworkRequest = (
		envType === 'node' && NodeDriver ||
		envType === 'rhino' && RhinoDriver ||
		envType === 'browser' && AJAXDriver
	);

	function evalSelector(object, selector) {
		var fragment;
		var selector = selector.split('.');
		while (selector.length) {
			fragment = selector.shift();
			if (Utils.isArray(object)) {
				if (Utils.isNumeric(fragment)) {
					fragment = parseInt(fragment, 10);
					if (fragment >= 0 &&
						fragment < object.length) {
						object = object[fragment];
						continue;
					}
				}
				return undefined;
			} else if (Utils.isObject(object)) {
				if (object.hasOwnProperty(fragment)) {
					object = object[fragment];
					continue;
				}
				return undefined;
			}
		}
		return object;
	}

	var f = {
	};

	f.build = function(requestURI, baseURI, load) {
		var selector = requestURI.split('#');
		var requestURI = Utils.uri.resolve(selector.shift(), baseURI);
		selector = selector.join('#');
		NetworkRequest(requestURI, function(resourceData) {
			resourceData = JSON.parse(resourceData);
			load(evalSelector(resourceData, selector));
		}, function() { load(undefined); });
	};

	f.load = function(name, req, load, config) {
		var selector = name.split('#');
		var requestURI = req.toUrl(selector.shift());
		selector = selector.join('#');
		NetworkRequest(requestURI, function(resourceData) {
			resourceData = JSON.parse(resourceData);
			load(evalSelector(resourceData, selector));
		}, function() { load(undefined); });
	};

	return f;

});