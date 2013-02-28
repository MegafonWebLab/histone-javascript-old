var Utils = require('./Utils.js');
var SYSTEM_QUIT = (typeof quit !== 'undefined' && quit);
var SYSTEM_PRINT = (typeof print !== 'undefined' && print);

var ENV_TYPE = (typeof process  === 'object' && (ENV_TYPE = 'node') ||
	typeof Packages === 'object' &&
	typeof JavaImporter === 'function' && (ENV_TYPE = 'rhino') ||
	typeof window !== 'undefined' && (ENV_TYPE = 'browser') ||
	(ENV_TYPE = 'unknown')
);

with (exports) {

	exports.print = function() {
		(ENV_TYPE === 'rhino' ?
			SYSTEM_PRINT :
			console.info
		).apply(this, arguments);
	};


	exports.quit = function(code) {
		if (ENV_TYPE === 'rhino') {
			SYSTEM_QUIT(code);
		} else if (ENV_TYPE === 'node') {
			process.exit(code);
		}
	};

	exports.getEnvType = function() {
		return ENV_TYPE;
	};

	exports.getEnv = function(name) {
		if (Utils.isString(name)) {
			var value = (ENV_TYPE === 'node' && process.env[name] ||
				ENV_TYPE === 'rhino' && java.lang.System.getenv(name));
			return (value ? String(value) : null);
		}
		var result = {};
		var regExp = Utils.isRegExp(name);
		var value = (ENV_TYPE === 'node' && process.env ||
			ENV_TYPE === 'rhino' && java.lang.System.getenv());

		var keySet = (ENV_TYPE === 'node' && Object.keys(value) ||
			ENV_TYPE === 'rhino' && value.keySet().toArray());

		for (var c = 0; c < keySet.length; c++) {
			var key = String(keySet[c]);
			if (regExp) {
				var matches = key.match(name);
				if (!matches) continue;
				result[matches[1] || key] = String(
					ENV_TYPE === 'rhino' && value.get(key) ||
					ENV_TYPE === 'node' && value[key]
				);
			} else result[key] = String(
				ENV_TYPE === 'rhino' && value.get(key) ||
				ENV_TYPE === 'node' && value[key]
			);
		}
		return result;
	};

	exports.getProp = (ENV_TYPE === 'rhino' && function(name) {
		if (Utils.isString(name)) {
			var value = java.lang.System.getProperty(name);
			return (value ? String(value) : null);
		}
		var result = {};
		var regExp = Utils.isRegExp(name);
		var value = java.lang.System.getProperties();
		var keySet = value.keySet().toArray();
		for (var c = 0; c < keySet.length; c++) {
			var key = String(keySet[c]);
			if (regExp) {
				var matches = key.match(name);
				if (!matches) continue;
				var val = String(value.get(key));
				result[matches[1] || key] = val;
			} else {
				result[key] = String(value.get(key));
			}
		}
		return result;
	});

}