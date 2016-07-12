define(['../Utils'], function(Utils) {

	var RES_IDLE = 0;
	var RES_LOADING = 1;
	var RES_LOADED = 2;
	var RESOURCES = {};

	function getResource(resourceURI) {
		return (Utils.isString(resourceURI) &&
			RESOURCES.hasOwnProperty(resourceURI) ?
			RESOURCES[resourceURI] :
			RESOURCES[resourceURI] = {
				status: RES_IDLE,
				waiting: []
			}
		);
	}

	function loadResource(resource, resourceData) {
		resource.data = resourceData;
		resource.status = RES_LOADED;
		var waiting = resource.waiting;
		while (waiting.length) {
			waiting.shift()(
				resourceData
			);
		}
	}

	return function(resourceURI, listener, loader) {

		var resource = getResource(resourceURI);

		if (resource.status === RES_LOADED)
			return listener(resource.data);

		resource.waiting.push(listener);

		if (resource.status !== RES_LOADING) {
			resource.status = RES_LOADING;
			loader(function(resourceData) {
				loadResource(resource, resourceData);
			});
		}
	};

});