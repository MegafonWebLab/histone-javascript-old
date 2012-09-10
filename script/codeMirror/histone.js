CodeMirror.defineMode('histone', function(config, parserConfig) {

	var keyFuncs = [
		// global functions
		'dayOfWeek',
		'daysInMonth',
		'include',
		'loadJSON',
		'loadText',
		'max',
		'min',
		'range',
		'uniqueId',
		// control structures
		'macro',
		'call',
		'import',
		'var',
		'for',
		'if'
	];

	var last;

	var regs = {
		operatorChars: /[+\-*&%=<>!?]/,
		validIdentifier: /[a-zA-Z0-9\_]/,
		stringChar: /[\'\"]/
	};

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
			} else {
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

		var ch = stream.next();
		if (ch == '$') {
			stream.eatWhile(regs.validIdentifier);
			return ret('variable-2', 'variable');
		} else if (ch == '.') {
			return ret('operator', 'property');
		} else if (regs.stringChar.test(ch)) {
			state.tokenize = inAttribute(ch);
			return ret('string', 'string');
		} else if (regs.operatorChars.test(ch)) {
			stream.eatWhile(regs.operatorChars);
			return ret('operator', 'operator');
		} else if (ch == '[' || ch == ']') {
			return ret('bracket', 'bracket');
		} else if (/\d/.test(ch)) {
			stream.eatWhile(/\d/);
			return ret('number', 'number');
		} else {
			if (state.last == 'variable') {
				if (ch == '@') {
					stream.eatWhile(regs.validIdentifier);
					return ret('property', 'property');
				} else if (ch == '|') {
					stream.eatWhile(regs.validIdentifier);
					return ret('qualifier', 'modifier');
				}
			} else if (state.last == 'whitespace') {
				stream.eatWhile(regs.validIdentifier);
				return ret('attribute', 'modifier');
			} else if (state.last == 'property') {
				stream.eatWhile(regs.validIdentifier);
				return ret('property', null);
			} else if (/\s/.test(ch)) {
				last = 'whitespace';
				return null;
			}
			var str = '';
			if (ch != '/') {
				str += ch;
			}
			var c = '';
			while ((c = stream.eat(regs.validIdentifier))) {
				str += c;
			}
			var i, j;
			for (i=0, j=keyFuncs.length; i<j; i++) {
				if (keyFuncs[i] == str) {
					return ret('keyword', 'keyword');
				}
			}
			if (/\s/.test(ch)) {
				return null;
			}
			return ret('tag', 'tag');
		}
	}

	function inAttribute(quote) {
		return function(stream, state) {
			while (!stream.eol()) {
				if (stream.next() == quote) {
					state.tokenize = inHistone;
					break;
				}
			}
			return 'string';
		};
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

	return {
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
});

CodeMirror.defineMIME('text/x-histone', 'histone');