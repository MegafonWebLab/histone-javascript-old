/**
 * Parser.js - Histone template engine.
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

define(['./Tokenizer.js'], function(Tokenizer) {

	// tokenizer instance
	var tokenizer;
	// escape sequence regexp
	var escapeSequence;
	// define contexts
	var T_CTX_TPL = 0, T_CTX_EXP = 1, T_CTX_CMT = 2, T_CTX_LIT = 3;
	// define tokens
	var T_COMMENT_START, T_COMMENT_END, T_LITERAL_START, T_LITERAL_END,
	T_BLOCK_START, T_BLOCK_END, T_IS, T_OR, T_AND, T_NOT, T_MOD, T_NULL,
	T_THIS, T_SELF, T_GLOBAL, T_NULL, T_TRUE, T_FALSE, T_CALL, T_IMPORT,
	T_IF, T_ELSEIF, T_ELSE, T_FOR, T_IN, T_VAR, T_MACRO, T_DOUBLE, T_INT,
	T_NOT_EQUAL, T_LESS_OR_EQUAL, T_GREATER_OR_EQUAL, T_LESS_THAN,
	T_GREATER_THAN, T_LBRACKET, T_RBRACKET, T_LPAREN, T_RPAREN, T_QUERY,
	T_EQUAL, T_COLON, T_COMMA, T_DOT, T_ADD, T_SUB, T_MUL, T_DIV,
	T_STRING, T_ID, T_IGNORE;

	function initialize() {
		// instantiate tokenizer
		tokenizer = new Tokenizer();
		// comment tokens
		T_COMMENT_START = tokenizer.addLiteral('{{\\*', T_CTX_TPL),
		T_COMMENT_END = tokenizer.addLiteral('\\*}}', T_CTX_CMT),
		// literal tokens
		T_LITERAL_START = tokenizer.addLiteral('{{%', T_CTX_TPL);
		T_LITERAL_END = tokenizer.addLiteral('%}}', T_CTX_LIT);
		// block tokens
		T_BLOCK_START = tokenizer.addLiteral('{{', T_CTX_TPL),
		T_BLOCK_END = tokenizer.addLiteral('}}', T_CTX_EXP),
		// operator tokens
		T_IS = tokenizer.addLiteral('is\\b', T_CTX_EXP),
		T_OR = tokenizer.addLiteral('or\\b', T_CTX_EXP);
		T_AND = tokenizer.addLiteral('and\\b', T_CTX_EXP),
		T_NOT = tokenizer.addLiteral('not\\b', T_CTX_EXP),
		T_MOD = tokenizer.addLiteral('mod\\b', T_CTX_EXP),
		// literal tokens
		T_THIS = tokenizer.addLiteral('this\\b', T_CTX_EXP),
		T_SELF = tokenizer.addLiteral('self\\b', T_CTX_EXP),
		T_GLOBAL = tokenizer.addLiteral('global\\b', T_CTX_EXP),
		T_NULL = tokenizer.addLiteral('null\\b', T_CTX_EXP),
		T_TRUE = tokenizer.addLiteral('true\\b', T_CTX_EXP),
		T_FALSE = tokenizer.addLiteral('false\\b', T_CTX_EXP),
		// statement tokens
		T_CALL = tokenizer.addLiteral('call\\b', T_CTX_EXP);
		T_IMPORT = tokenizer.addLiteral('import\\b', T_CTX_EXP);
		T_IF = tokenizer.addLiteral('if\\b', T_CTX_EXP),
		T_ELSEIF = tokenizer.addLiteral('elseif\\b', T_CTX_EXP),
		T_ELSE = tokenizer.addLiteral('else\\b', T_CTX_EXP),
		T_FOR = tokenizer.addLiteral('for\\b', T_CTX_EXP),
		T_IN = tokenizer.addLiteral('in\\b', T_CTX_EXP),
		T_VAR = tokenizer.addLiteral('var\\b', T_CTX_EXP),
		T_MACRO = tokenizer.addLiteral('macro\\b', T_CTX_EXP),
		T_DOUBLE = tokenizer.addToken([
			'(?:[0-9]*\\.)?[0-9]+[eE][\\+\\-]?[0-9]+', '[0-9]*\\.[0-9]+'
		], T_CTX_EXP),
		T_INT = tokenizer.addToken('[0-9]+', T_CTX_EXP),
		// relational operators
		T_NOT_EQUAL = tokenizer.addLiteral('isNot\\b', T_CTX_EXP),
		T_LESS_OR_EQUAL = tokenizer.addLiteral('<=', T_CTX_EXP),
		T_GREATER_OR_EQUAL = tokenizer.addLiteral('>=', T_CTX_EXP),
		T_LESS_THAN = tokenizer.addLiteral('<', T_CTX_EXP),
		T_GREATER_THAN = tokenizer.addLiteral('>', T_CTX_EXP),
		// punctuators
		T_LBRACKET = tokenizer.addLiteral('\\[', T_CTX_EXP),
		T_RBRACKET = tokenizer.addLiteral('\\]', T_CTX_EXP),
		T_LPAREN = tokenizer.addLiteral('\\(', T_CTX_EXP),
		T_RPAREN = tokenizer.addLiteral('\\)', T_CTX_EXP),
		T_QUERY = tokenizer.addLiteral('\\?', T_CTX_EXP),
		T_EQUAL = tokenizer.addLiteral('=', T_CTX_EXP),
		T_COLON = tokenizer.addLiteral(':', T_CTX_EXP),
		T_COMMA = tokenizer.addLiteral(',', T_CTX_EXP),
		// mathematical operators
		T_DOT = tokenizer.addLiteral('\\.', T_CTX_EXP),
		T_ADD = tokenizer.addLiteral('\\+', T_CTX_EXP),
		T_SUB = tokenizer.addLiteral('\\-', T_CTX_EXP),
		T_MUL = tokenizer.addLiteral('\\*', T_CTX_EXP),
		T_DIV = tokenizer.addLiteral('\\/', T_CTX_EXP),
		T_STRING = tokenizer.addToken([
			'\'(?:[^\'\\\\]|\\\\.)*\'',
			'\"(?:[^\"\\\\]|\\\\.)*\"'
		], T_CTX_EXP),
		T_ID = tokenizer.addToken('[a-zA-Z_$][a-zA-Z0-9_$]*', T_CTX_EXP),
		T_IGNORE = tokenizer.addIgnore('[\x09\x0A\x0D\x20]+', T_CTX_EXP);
		// initialize transitions
		tokenizer.addTransition(T_COMMENT_START, T_CTX_CMT);
		tokenizer.addTransition(T_COMMENT_END, T_CTX_TPL);
		tokenizer.addTransition(T_LITERAL_START, T_CTX_LIT);
		tokenizer.addTransition(T_LITERAL_END, T_CTX_TPL);
		tokenizer.addTransition(T_BLOCK_START, T_CTX_EXP);
		tokenizer.addTransition(T_BLOCK_END, T_CTX_TPL);
	}

	function extractStringData(string) {
		var string = string.slice(1, -1);
		return string.replace(escapeSequence || (escapeSequence = new RegExp(
			'\\\\(t|b|n|r|f|\'|\"|\\\\|\\x[0-9A-F]{2}|\\u[0-9A-F]{4})', 'g'
		)), function(str, ch) { switch (ch[0]) {
			// single quotation mark
			case '\'': return '\'';
			// double quotation mark
			case '\"': return '"';
			// backslash
			case '\\': return '\\';
			// backspace
			case 'b': return String.fromCharCode(8);
			// horizontal tab
			case 't': return String.fromCharCode(9);
			// new line
			case 'n': return String.fromCharCode(10);
			// form feed
			case 'f': return String.fromCharCode(12);
			// carriage return
			case 'r': return String.fromCharCode(13);
			// unicode sequence (4 hex digits: dddd)
			case 'u': return String.fromCharCode(parseInt(ch.substr(1), 16));
			// hexadecimal sequence (2 digits: dd)
			case 'x': return String.fromCharCode(parseInt(ch.substr(1), 16));
		}});
	}

	var Parser = function() {

		var fileName;

		function ParseError(expected, found) {
			var found = (found || tokenizer.getFragment());
			var lineNumber = tokenizer.getLineNumber();
			var errorMessage = (
				fileName + '(' + lineNumber +
				') Syntax error, "' + expected +
				'" expected, but "' + found + '" found'
			);
			return {
				file: fileName, line: lineNumber,
				expected: expected, found: found,
				toString: function() { return errorMessage; }
			};
		}

		function parseMap() {

			var items = [];
			var key, value;

			if (!tokenizer.test(T_RBRACKET)) {
				while (true) {

					key = null;
					value = parseExpression();

					if (tokenizer.next(T_COLON)) {

						if (value[0] !== Parser.T_STRING &&
							value[0] !== Parser.T_INT && (
								value[0] !== Parser.T_SELECTOR ||
								value[1].length !== 1
							)) {
							throw new ParseError('identifier, string, number');
						}

						if (value[0] !== Parser.T_SELECTOR) {
							key = value[1];
						} else key = value[1][0];

						value = parseExpression();
					}

					items.push([key, value]);
					if (!tokenizer.next(T_COMMA)) break;
				}
			}
			if (!tokenizer.next(T_RBRACKET)) {
				throw new ParseError(']');
			}
			return [Parser.T_MAP, items];
		}

		function parseSimpleExpression() {

			if (tokenizer.next(T_NULL)) {
				return [Parser.T_NULL];
			}

			else if (tokenizer.next(T_TRUE)) {
				return [Parser.T_TRUE];
			}

			else if (tokenizer.next(T_FALSE)) {
				return [Parser.T_FALSE];
			}

			else if (tokenizer.test(T_INT)) {
				var value = tokenizer.next();
				value = parseInt(value.value, 10);
				return [Parser.T_INT, value];
			}

			else if (tokenizer.test(T_DOUBLE)) {
				var value = tokenizer.next();
				value = parseFloat(value.value, 10);
				return [Parser.T_DOUBLE, value];
			}

			else if (tokenizer.test(T_STRING)) {
				var value = tokenizer.next();
				value = extractStringData(value.value);
				return [Parser.T_STRING, value];
			}

			else if (tokenizer.next(T_LBRACKET)) {
				return parseMap();
			}

			else if (tokenizer.test(T_ID)) {
				var value = tokenizer.next();
				return [Parser.T_SELECTOR, [value.value]];
			}

			else if (tokenizer.next(T_THIS)) {
				return [Parser.T_SELECTOR, ['this']];
			}

			else if (tokenizer.next(T_SELF)) {
				return [Parser.T_SELECTOR, ['self']];
			}

			else if (tokenizer.next(T_GLOBAL)) {
				return [Parser.T_SELECTOR, ['global']];
			}

			else if (tokenizer.next(T_LPAREN)) {
				if (tokenizer.next(T_RPAREN)) {
					throw new ParseError('expression', '()');
				}
				try {
					var expression = parseExpression();
				} finally {
					if (!tokenizer.next(T_RPAREN)) {
						throw new ParseError(')');
					}
				}
				return expression;
			}

			else throw new ParseError('expression');
		}

		function parsePrimaryExpression() {

			var left = (tokenizer.next(T_SUB) ? [
				Parser.T_NEGATE, parseSimpleExpression()
			] : parseSimpleExpression());

			while (true) {

				if (tokenizer.next(T_DOT)) {
					if (!tokenizer.test(T_ID)) {
						throw new ParseError('identifier');
					}
					if (left[0] !== Parser.T_SELECTOR) {
						left = [Parser.T_SELECTOR, [left]];
					}
					left[1].push(tokenizer.next().value);
				}

				else if (tokenizer.next(T_LBRACKET)) {
					if (tokenizer.next(T_RBRACKET)) {
						throw new ParseError('expression', '[]');
					}
					if (left[0] !== Parser.T_SELECTOR) {
						left = [Parser.T_SELECTOR, [left]];
					}
					left[1].push(parseExpression());
					if (!tokenizer.next(T_RBRACKET)) {
						throw new ParseError(']');
					}
				}

				else if (left[0] === Parser.T_SELECTOR &&
					tokenizer.next(T_LPAREN)) {

					var args = null, name, context;
					if (!tokenizer.next(T_RPAREN)) {
						args = [];
						while (true) {
							args.push(parseExpression());
							if (!tokenizer.next(T_COMMA)) break;
						}
						if (!tokenizer.next(T_RPAREN)) {
							throw new ParseError(')');
						}
					}
					name = left[1].pop();
					context = (left[1].length ? left : null);
					left = [Parser.T_CALL, context, name, args];
				}

				else break;
			}
			return left;
		}

		function parseUnaryExpression() {
			return (tokenizer.next(T_NOT) && [
				Parser.T_NOT, parseUnaryExpression()
			] || (tokenizer.next(T_ADD),
				parsePrimaryExpression()
			));
		}

		function parseMulExpression() {
			var left = parseUnaryExpression();
			while (tokenizer.next(T_MUL) && (
				left = [Parser.T_MUL, left, parseUnaryExpression()]
			) || tokenizer.next(T_DIV) && (
				left = [Parser.T_DIV, left, parseUnaryExpression()]
			) || tokenizer.next(T_MOD) && (
				left = [Parser.T_MOD, left, parseUnaryExpression()]
			)){};
			return left;
		}

		function parseAddExpression() {
			var left = parseMulExpression();
			while (tokenizer.next(T_ADD) && (
				left = [Parser.T_ADD, left, parseMulExpression()]
			) || tokenizer.next(T_SUB) && (
				left = [Parser.T_SUB, left, parseMulExpression()]
			)){};
			return left;
		}

		function parseRelExpression() {
			var left = parseAddExpression();
			return (tokenizer.next(T_LESS_OR_EQUAL) && [
				Parser.T_LESS_OR_EQUAL, left, parseAddExpression()
			] || tokenizer.next(T_LESS_THAN) && [
				Parser.T_LESS_THAN, left, parseAddExpression()
			] || tokenizer.next(T_GREATER_OR_EQUAL) && [
				Parser.T_GREATER_OR_EQUAL, left, parseAddExpression()
			] || tokenizer.next(T_GREATER_THAN) && [
				Parser.T_GREATER_THAN, left, parseAddExpression()
			] || left);
		}

		function parseEqExpression() {
			var left = parseRelExpression();
			while (tokenizer.next(T_IS) && (
				left = [Parser.T_EQUAL, left, parseRelExpression()]
			) || tokenizer.next(T_NOT_EQUAL) && (
				left = [Parser.T_NOT_EQUAL, left, parseRelExpression()]
			)){};
			return left;
		}

		function parseAndExpression() {
			var left = parseEqExpression();
			while (tokenizer.next(T_AND) && (
				left = [Parser.T_AND, left, parseEqExpression()]
			)){};
			return left;
		}

		function parseOrExpression() {
			var left = parseAndExpression();
			while (tokenizer.next(T_OR) && (
				left = [Parser.T_OR, left, parseAndExpression()]
			)){};
			return left;
		}

		function parseTernaryExpression() {
			var left = parseOrExpression();
			while (tokenizer.next(T_QUERY)) {
				left = [Parser.T_TERNARY, left, parseExpression()];
				if (tokenizer.next(T_COLON)) left.push(parseExpression());
			}
			return left;
		}

		function parseExpression() {
			return parseTernaryExpression();
		}

		function parseVarStatement() {
			if (!tokenizer.next(T_VAR)) return;
			var name = tokenizer.next(T_ID);
			if (!name) throw new ParseError('identifier');
			var expression;
			if (!tokenizer.next(T_EQUAL)) {
				if (!tokenizer.next(T_BLOCK_END)) {
					throw new ParseError('}}');
				}
				expression = [
					Parser.T_STATEMENTS,
					parseStatements(T_DIV)
				];
				if (!tokenizer.next(T_DIV) ||
					!tokenizer.next(T_VAR) ||
					!tokenizer.next(T_BLOCK_END)) {
					throw new ParseError('{{/var}}');
				}
			} else {
				expression = parseExpression();
				if (!tokenizer.next(T_BLOCK_END)) {
					throw new ParseError('}}');
				}
			}
			return [Parser.T_VAR, name.value, expression];
		}

		function parseIfStatement() {
			if (!tokenizer.next(T_IF)) return;
			var conditions = [], expression, statements;

			while (true) {
				expression = parseExpression();
				if (!tokenizer.next(T_BLOCK_END)) {
					throw new ParseError('}}');
				}
				statements = parseStatements(T_DIV, T_ELSE, T_ELSEIF);
				conditions.push([expression, statements]);
				if (!tokenizer.next(T_ELSEIF)) break;
			}

			if (tokenizer.next(T_ELSE)) {
				if (!tokenizer.next(T_BLOCK_END)) {
					throw new ParseError('}}');
				}
				statements = parseStatements(T_DIV);
				conditions.push([[Parser.T_TRUE], statements]);
			}

			if (!tokenizer.next(T_DIV) ||
				!tokenizer.next(T_IF) ||
				!tokenizer.next(T_BLOCK_END)) {
				throw new ParseError('{{/if}}');
			}

			return [Parser.T_IF, conditions];
		}

		function parseForStatement() {
			if (!tokenizer.next(T_FOR)) return;
			var iterator = tokenizer.next(T_ID);
			if (!iterator) throw new ParseError('identifier');
			iterator = [iterator.value];

			if (tokenizer.next(T_COLON)) {
				var key = tokenizer.next(T_ID);
				if (!key) throw new ParseError('identifier');
				iterator.unshift(key.value);
			}

			if (!tokenizer.next(T_IN)) throw new ParseError('in');
			var expression = parseExpression();
			if (!tokenizer.next(T_BLOCK_END)) {
				throw new ParseError('}}');
			}

			var statements = [parseStatements(T_DIV, T_ELSE)];
			if (tokenizer.next(T_ELSE)) {
				if (!tokenizer.next(T_BLOCK_END)) {
					throw new ParseError('}}');
				}
				statements.push(parseStatements(T_DIV));
			}

			if (!tokenizer.next(T_DIV) ||
				!tokenizer.next(T_FOR) ||
				!tokenizer.next(T_BLOCK_END)) {
				throw new ParseError('{{/for}}');
			}

			return [Parser.T_FOR, iterator, expression, statements];
		}

		function parseMacroStatement() {
			if (!tokenizer.next(T_MACRO)) return;
			var name = tokenizer.next(T_ID);
			if (!name) throw new ParseError('identifier');
			var args = [];
			if (tokenizer.next(T_LPAREN)) {
				if (!tokenizer.next(T_RPAREN)) {
					while (true) {
						var arg = tokenizer.next(T_ID);
						if (!arg) throw new ParseError('identifier');
						args.push(arg.value);
						if (!tokenizer.next(T_COMMA)) break;
					}
					if (!tokenizer.next(T_RPAREN)) {
						throw new ParseError(')');
					}
				}
			}

			if (!tokenizer.next(T_BLOCK_END)) {
				throw new ParseError('}}');
			}

			var statements = parseStatements(T_DIV);

			if (!tokenizer.next(T_DIV) ||
				!tokenizer.next(T_MACRO) ||
				!tokenizer.next(T_BLOCK_END)) {
				throw new ParseError('{{/macro}}');
			}

			return [Parser.T_MACRO, name.value, args, statements];
		}

		function parseCallStatement() {
			if (!tokenizer.next(T_CALL)) return;
			var name = tokenizer.next(T_ID);
			if (!name) throw new ParseError('identifier');

			var args = [];
			if (tokenizer.next(T_LPAREN)) {
				if (!tokenizer.next(T_RPAREN)) {
					while (true) {
						args.push(parseExpression());
						if (!tokenizer.next(T_COMMA)) break;
					}
					if (!tokenizer.next(T_RPAREN)) {
						throw new ParseError(')');
					}
				}
			}
			if (!tokenizer.next(T_BLOCK_END)) {
				throw new ParseError('}}');
			}


			args.push([
				Parser.T_STATEMENTS,
				parseStatements(T_DIV)
			]);

			if (!tokenizer.next(T_DIV) ||
				!tokenizer.next(T_CALL) ||
				!tokenizer.next(T_BLOCK_END)) {
				throw new ParseError('{{/call}}');
			}

			return [Parser.T_CALL, null, name.value, args];
		}

		function parseImportStatement() {
			if (!tokenizer.next(T_IMPORT)) return;
			var file = tokenizer.next(T_STRING);
			if (!file) throw new ParseError('string');
			file = extractStringData(file.value);
			if (!tokenizer.next(T_BLOCK_END)) {
				throw new ParseError('}}');
			}
			return [Parser.T_IMPORT, file];
		}

		function parseExpressionStatement() {
			var expression = parseExpression();
			if (!tokenizer.next(T_BLOCK_END)) {
				throw new ParseError('}}');
			}
			return expression;
		}

		function parseStatements() {
			var statements = [], statement;
			while (!tokenizer.next(Tokenizer.T_EOF)) {

				// skip comments
				while (tokenizer.next(T_COMMENT_START)) {
					while (!tokenizer.test(T_COMMENT_END) &&
						!tokenizer.next(Tokenizer.T_EOF)) {
						tokenizer.next();
					}
					if (!tokenizer.next(T_COMMENT_END)) {
						throw new ParseError('*}}');
					}
				}

				// parse literals
				while (tokenizer.next(T_LITERAL_START)) {
					var literalStr = '';
					while (!tokenizer.test(T_LITERAL_END) &&
						!tokenizer.next(Tokenizer.T_EOF)) {
						literalStr += tokenizer.next().value;
					}
					if (!tokenizer.next(T_LITERAL_END)) {
						throw new ParseError('%}}');
					}
					statements.push(literalStr);
				}

				// parse instructions
				if (tokenizer.next(T_BLOCK_START)) {
					// break on following tokens
					var excludes = Array.prototype.slice.call(arguments);
					if (excludes) {
						var isExcluded = false;
						while (excludes.length) {
							if (tokenizer.test(excludes.shift())) {
								isExcluded = true;
								break;
							}
						}
						if (isExcluded) break;
					}
					// skip empty instructions
					if (tokenizer.next(T_BLOCK_END)) continue;
					// parse statements
					statements.push(
						parseIfStatement() ||
						parseForStatement() ||
						parseVarStatement() ||
						parseMacroStatement() ||
						parseCallStatement() ||
						parseImportStatement() ||
						parseExpressionStatement()
					);
				}

				// parse text fragments
				else if (tokenizer.test(Tokenizer.T_FRAGMENT)) {
					statements.push(tokenizer.next().value);
				}
			}
			return statements;
		}

		this.parse = function(templateStr, baseURI) {
			fileName = (baseURI || 'template');
			if (!tokenizer) initialize();
			tokenizer.tokenize(templateStr, T_CTX_TPL);
			return parseStatements();
		};
	};

	Parser.T_OR = 1, Parser.T_AND = 2, Parser.T_EQUAL = 3,
	Parser.T_NOT_EQUAL = 4, Parser.T_LESS_OR_EQUAL = 5,
	Parser.T_LESS_THAN = 6, Parser.T_GREATER_OR_EQUAL = 7,
	Parser.T_GREATER_THAN = 8, Parser.T_ADD = 9, Parser.T_SUB = 10,
	Parser.T_MUL = 11, Parser.T_DIV = 12, Parser.T_MOD = 13,
	Parser.T_NEGATE = 14, Parser.T_NOT = 15, Parser.T_TRUE = 16,
	Parser.T_FALSE = 17, Parser.T_NULL = 100, Parser.T_INT = 101,
	Parser.T_DOUBLE = 102, Parser.T_STRING = 103, Parser.T_TERNARY = 104,
	Parser.T_SELECTOR = 105, Parser.T_CALL = 106, Parser.T_MAP = 107,
	Parser.T_STATEMENTS = 109, Parser.T_IMPORT = 110, Parser.T_IF = 1000,
	Parser.T_VAR = 1001, Parser.T_FOR = 1002, Parser.T_MACRO = 1003;

	return Parser;
});