CodeMirror.defineMode('histone', function(config, parserConfig) {

	var reservedWords = [
		'is', 'or', 'and', 'not', 'mod',
		'null', 'true', 'false', 'call',
		'import', 'if', 'elseif', 'else',
		'for', 'in', 'var', 'macro', 'isNot'
	];

	var reservedVars =  [
		'this',
		'global',
		'self'
	];

	var globalFunctions = [
		'dayOfWeek',
		'daysInMonth',
		'include',
		'loadJSON',
		'loadText',
		'max',
		'min',
		'range',
		'uniqueId',
		'resolveURI',
		'baseURI',
		'clientType',
		'userAgent'
	];

	function indexOf(array, find, i) {
		if (Array.prototype.indexOf) {
			return array.indexOf(find, i);
		}
		if (i===undefined) i= 0;
		if (i < 0) i += array.length;
		if (i < 0) i = 0;
		for (var c = array.length; i < c; i++) {
			if (i in array && array[i] === find) {
				return i;
			}
		}
		return -1;
	}

	var last;

	var leftDelim = (typeof config.mode.leftDelimiter != 'undefined') ? config.mode.leftDelimiter : '{{';
	var rightDelim = (typeof config.mode.rightDelimiter != 'undefined') ? config.mode.rightDelimiter : '}}';

	function ret(style, lst) { last = lst; return style; }

	function tokenizer(stream, state) {

		function chain(parser) {
			state.tokenize = parser;
			return parser(stream, state);
		}

		if (stream.match(leftDelim, true)) {
			if (stream.eat('*')) {
				return chain(inBlock('comment', '*' + rightDelim));
			}

			else if (stream.eat('%')) {
				return chain(inBlock('string', '%' + rightDelim));
			}

			else {
				state.tokenize = inHistone;
				return 'tag';
			}
		} else {
			// I'd like to do an eatWhile() here, but I can't get it to eat only up to the rightDelim string/char
			stream.next();
			return null;
		}
	}

	function inHistone(stream, state) {

		if (stream.match(rightDelim, true)) {
			state.tokenize = tokenizer;
			return ret('tag', null);
		}

		var f;

		if (f = stream.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/)) {
			if (indexOf(reservedWords, f[0]) !== -1) {
				return ret('keyword', 'keyword');
			}
			else if (indexOf(reservedVars, f[0]) !== -1) {
				return ret('keyword', 'keyword');
			}
			else if (indexOf(globalFunctions, f[0]) !== -1) {
				return ret('builtin', 'builtin');
			}
			else {
				return ret('variable', 'variable');
			}
		}

		else if (stream.match(/^('(?:[^'\\]|\\.)*')/) ||
			stream.match(/^("(?:[^"\\]|\\.)*")/)) {
			return ret('string', 'string');
		}

		else if (stream.match(/^(?:[0-9]*\.)?[0-9]+[eE][\+\-]?[0-9]+/) ||
			stream.match(/^([0-9]*\.[0-9]+)/) ||
			stream.match(/^([0-9]+)/)) {
			return ret('number', 'number');
		}

		else if (stream.match(/^([\[\]\(\)])/) ||
			stream.match(/^(<=|>=|>|<|\?|=|:|,|\.|\+|\-|\*|\/)/)) {
			return ret('qualifier', 'qualifier');
		}


		else {
			var ch = stream.next();
		}

		return null;
	}

	function inBlock(style, terminator) {
		return function(stream, state) {
			while (!stream.eol()) {
				if (stream.match(terminator)) {
					state.tokenize = tokenizer;
					break;
				}
				stream.next();
			}
			return style;
		};
	}

	var histoneOverlay = {
		electricChars: '',
		startState: function() {
			return {
				tokenize: tokenizer,
				mode: 'histone',
				last: null
			};
		},
		token: function(stream, state) {
			var style = state.tokenize(stream, state);
			state.last = last;
			return style;
		}
	};

	return CodeMirror.overlayMode(CodeMirror.getMode(
		config, parserConfig.backdrop || 'text/html'
	), histoneOverlay);
});

CodeMirror.defineMIME('text/x-histone', 'histone');