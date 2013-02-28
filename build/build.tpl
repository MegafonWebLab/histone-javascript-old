{{var $global = uniqueId()}}
(function({{$global}}) {

	{{var alias = this.alias}}
	{{var module = this.module}}

	{{var isBrowser = uniqueId()}}
	{{var isNodeJS = uniqueId()}}
	{{var isNotKrang = uniqueId()}}
	{{var currentScript = uniqueId()}}
	{{var mainExport = uniqueId()}}

	var {{isBrowser}} = (
		typeof {{$global}}.window === 'object' &&
		typeof {{$global}}.window.navigator === 'object' &&
		typeof {{$global}}.window.navigator.userAgent === 'string'
	),

	{{isNodeJS}} = (
		typeof this.process === 'object' &&
		typeof this.process.version === 'string' &&
		typeof module === 'object' &&
		typeof module.exports === 'object'
	),

	{{isNotKrang}} = (
		typeof {{$global}}.krang !== 'function' ||
		typeof {{$global}}.krang.getCurrentScript !== 'function'
	),

	{{currentScript}} = ({{isNotKrang}} ? function() {

		if ({{isNodeJS}}) return __filename;
		if (!{{isBrowser}}) return;

		var scripts = ({{$global}}.document &&
			{{$global}}.document.getElementsByTagName ?
			document.getElementsByTagName('script') : []
		);

		if ({{$global}}.document && {{$global}}.document.currentScript) {
			return {{$global}}.document.currentScript;
		} else try { throw new Error(); } catch (exception) {
			if (exception.stack) {
				var scriptURI = exception.stack;
				if (scriptURI.indexOf('@') === -1) {
					scriptURI = scriptURI.split('\n').pop();
					scriptURI = scriptURI.split(' ').pop();
				} else scriptURI = scriptURI.split('@').pop();
				scriptURI = scriptURI.split(/(\:\d+)+\s*$/).shift();
				for (var c = 0; c < scripts.length; c++) {
					if (scripts[c].src !== scriptURI) continue;
					return scripts[c];
				}
			} else for (var c = 0; c < scripts.length; c++) {
				if (scripts[c].readyState !== 'interactive') continue;
				return scripts[c];
			}
		}

	}() : {{$global}}.krang.getCurrentScript().src);

	{{for dependency in module}}
		{{var exportAs = dependency.exportAs}}
		{{var exportAs = dependency.main ? mainExport : exportAs}}
		{{if dependency.type is 'global'}}
			var {{exportAs}} = {{$global}};
		{{elseif dependency.type is 'module'}}
			var {{exportAs}} = {"uri": {{currentScript}}};
		{{else}}
			var {{exportAs}} = {{dependency.data}};
		{{/if}}
	{{/for}}

	if ({{isNodeJS}}) module.exports = {{mainExport}};

	else if ({{isNotKrang}} || !define(function() {
		return {{mainExport}};
	})) {{$global}}[{{alias.toJSON()}}] = {{mainExport}};

})(function() { return this; }.call(null));