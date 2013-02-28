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

define(['./Tokenizer', './Constants'], function(Tokenizer, AST) {

	var escapeSequence, tokenizer, nestLevel, fileName;
	var T_CTX_TPL = 0, T_CTX_EXP = 1, T_CTX_CMT = 2, T_CTX_LIT = 3;

	function initialize() {
		// instantiate tokenizer
		tokenizer = new Tokenizer();

		// comment tokens
		tokenizer.addLiteral('COMMENT_START', '{{\\*', T_CTX_TPL);
		tokenizer.addLiteral('COMMENT_END', '\\*}}', T_CTX_CMT);

		// literal tokens
		tokenizer.addLiteral('LITERAL_START', '{{%', T_CTX_TPL);
		tokenizer.addLiteral('LITERAL_END', '%}}', T_CTX_LIT);

		// block tokens
		tokenizer.addToken('BLOCK_START', '{{', [T_CTX_TPL, T_CTX_EXP]);
		tokenizer.addToken('BLOCK_END', '}}', [T_CTX_TPL, T_CTX_EXP]);

		// operator tokens
		tokenizer.addLiteral('IS', 'is\\b', T_CTX_EXP);
		tokenizer.addLiteral('OR', 'or\\b', T_CTX_EXP);
		tokenizer.addLiteral('AND', 'and\\b', T_CTX_EXP);
		tokenizer.addLiteral('NOT', 'not\\b', T_CTX_EXP);
		tokenizer.addLiteral('MOD', 'mod\\b', T_CTX_EXP);

		// literal tokens
		tokenizer.addLiteral('THIS', 'this\\b', T_CTX_EXP);
		tokenizer.addLiteral('SELF', 'self\\b', T_CTX_EXP);
		tokenizer.addLiteral('GLOBAL', 'global\\b', T_CTX_EXP);
		tokenizer.addLiteral('NULL', 'null\\b', T_CTX_EXP);
		tokenizer.addLiteral('TRUE', 'true\\b', T_CTX_EXP);
		tokenizer.addLiteral('FALSE', 'false\\b', T_CTX_EXP);

		// statement tokens
		tokenizer.addLiteral('IF', 'if\\b', T_CTX_EXP);
		tokenizer.addLiteral('ELSEIF', 'elseif\\b', T_CTX_EXP);
		tokenizer.addLiteral('ELSE', 'else\\b', T_CTX_EXP);
		tokenizer.addLiteral('FOR', 'for\\b', T_CTX_EXP);
		tokenizer.addLiteral('IN', 'in\\b', T_CTX_EXP);
		tokenizer.addLiteral('VAR', 'var\\b', T_CTX_EXP);
		tokenizer.addLiteral('MACRO', 'macro\\b', T_CTX_EXP);

		tokenizer.addToken('DOUBLE', '(?:[0-9]*\\.)?[0-9]+[eE][\\+\\-]?[0-9]+', T_CTX_EXP);
		tokenizer.addToken('DOUBLE', '[0-9]*\\.[0-9]+', T_CTX_EXP);
		tokenizer.addToken('INT', '[0-9]+', T_CTX_EXP);

		// relational operators
		tokenizer.addLiteral('NOT_EQUAL', 'isNot\\b', T_CTX_EXP);
		tokenizer.addLiteral('LESS_OR_EQUAL', '<=', T_CTX_EXP);
		tokenizer.addLiteral('GREATER_OR_EQUAL', '>=', T_CTX_EXP);
		tokenizer.addLiteral('LESS_THAN', '<', T_CTX_EXP);
		tokenizer.addLiteral('GREATER_THAN', '>', T_CTX_EXP);

		// punctuators
		tokenizer.addLiteral('LBRACKET', '\\[', T_CTX_EXP);
		tokenizer.addLiteral('RBRACKET', '\\]', T_CTX_EXP);
		tokenizer.addLiteral('LPAREN', '\\(', T_CTX_EXP);
		tokenizer.addLiteral('RPAREN', '\\)', T_CTX_EXP);
		tokenizer.addLiteral('QUERY', '\\?', T_CTX_EXP);
		tokenizer.addLiteral('EQUAL', '=', T_CTX_EXP);
		tokenizer.addLiteral('COLON', ':', T_CTX_EXP);
		tokenizer.addLiteral('COMMA', ',', T_CTX_EXP);

		// mathematical operators
		tokenizer.addLiteral('DOT', '\\.', T_CTX_EXP);
		tokenizer.addLiteral('ADD', '\\+', T_CTX_EXP);
		tokenizer.addLiteral('SUB', '\\-', T_CTX_EXP);
		tokenizer.addLiteral('MUL', '\\*', T_CTX_EXP);
		tokenizer.addLiteral('DIV', '\\/', T_CTX_EXP);
		tokenizer.addToken('STRING', '\'(?:[^\'\\\\]|\\\\.)*\'', T_CTX_EXP);
		tokenizer.addToken('STRING', '\"(?:[^\"\\\\]|\\\\.)*\"', T_CTX_EXP);

		tokenizer.addToken('ID', '[a-zA-Z_$][a-zA-Z0-9_$]*', T_CTX_EXP);
		tokenizer.addIgnore('[\x09\x0A\x0D\x20]+', T_CTX_EXP);

		// initialize transitions
		tokenizer.addTransition(tokenizer.COMMENT_START, T_CTX_CMT);
		tokenizer.addTransition(tokenizer.COMMENT_END, T_CTX_TPL);
		tokenizer.addTransition(tokenizer.LITERAL_START, T_CTX_LIT);
		tokenizer.addTransition(tokenizer.LITERAL_END, T_CTX_TPL);
		// initialize special transitions
		tokenizer.addTransition(tokenizer.BLOCK_START, function() {
			var result = (nestLevel % 2 ? T_CTX_TPL : T_CTX_EXP);
			nestLevel++;
			return result;
		});
		tokenizer.addTransition(tokenizer.BLOCK_END, function() {
			if (nestLevel === 0) return T_CTX_TPL;
			var result = (nestLevel % 2 ? T_CTX_TPL : T_CTX_EXP);
			nestLevel--;
			return result;
		});
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

		if (!tokenizer.test(tokenizer.RBRACKET)) {
			while (true) {

				key = null;
				value = parseExpression();

				if (tokenizer.next(tokenizer.COLON)) {

					if (value[0] !== AST.STRING &&
						value[0] !== AST.INT && (
							value[0] !== AST.SELECTOR ||
							value[1].length !== 1
						)) {
						throw new ParseError('identifier, string, number');
					}

					if (value[0] !== AST.SELECTOR) {
						key = String(value[1]);
					} else key = String(value[1][0]);

					value = parseExpression();
				}

				items.push([key, value]);
				if (!tokenizer.next(tokenizer.COMMA)) break;
			}
		}
		if (!tokenizer.next(tokenizer.RBRACKET)) {
			throw new ParseError(']');
		}
		return [AST.MAP, items];
	}

	function parseSimpleExpression() {

		if (tokenizer.next(tokenizer.NULL)) {
			return [AST.NULL];
		}

		else if (tokenizer.next(tokenizer.TRUE)) {
			return [AST.TRUE];
		}

		else if (tokenizer.next(tokenizer.FALSE)) {
			return [AST.FALSE];
		}

		else if (tokenizer.test(tokenizer.INT)) {
			var value = tokenizer.next();
			value = parseInt(value.value, 10);
			return [AST.INT, value];
		}

		else if (tokenizer.test(tokenizer.DOUBLE)) {
			var value = tokenizer.next();
			value = parseFloat(value.value, 10);
			return [AST.DOUBLE, value];
		}

		else if (tokenizer.test(tokenizer.STRING)) {
			var value = tokenizer.next();
			value = extractStringData(value.value);
			return [AST.STRING, value];
		}

		else if (tokenizer.next(tokenizer.LBRACKET)) {
			return parseMap();
		}

		else if (tokenizer.test(tokenizer.ID)) {
			var value = tokenizer.next();
			return [AST.SELECTOR, [value.value]];
		}

		else if (tokenizer.next(tokenizer.THIS)) {
			return [AST.SELECTOR, ['this']];
		}

		else if (tokenizer.next(tokenizer.SELF)) {
			return [AST.SELECTOR, ['self']];
		}

		else if (tokenizer.next(tokenizer.GLOBAL)) {
			return [AST.SELECTOR, ['global']];
		}

		else if (tokenizer.next(tokenizer.LPAREN)) {
			if (tokenizer.next(tokenizer.RPAREN)) {
				throw new ParseError('expression', '()');
			}
			try {
				var expression = parseExpression();
			} finally {
				if (!tokenizer.next(tokenizer.RPAREN)) {
					throw new ParseError(')');
				}
			}
			return expression;
		}

		else if (tokenizer.next(tokenizer.BLOCK_START)) {
			var statements = [];
			while (!tokenizer.next(Tokenizer.T_EOF)) {
				if (tokenizer.next(tokenizer.BLOCK_START)) {
					statements.push(parseStatement());
				} else if (tokenizer.next(tokenizer.BLOCK_END)) {
					return [AST.STATEMENTS, statements];
				} else if (!tokenizer.test(Tokenizer.T_EOF)) {
					statements.push(tokenizer.next().value);
				}
			}

			throw new ParseError('}}');
		}

		else throw new ParseError('expression');
	}

	function parsePrimaryExpression() {

		var left = (tokenizer.next(tokenizer.SUB) ? [
			AST.NEGATE, parseSimpleExpression()
		] : parseSimpleExpression());

		while (true) {

			if (tokenizer.next(tokenizer.DOT)) {
				if (!tokenizer.test(tokenizer.ID)) {
					throw new ParseError('identifier');
				}
				if (left[0] !== AST.SELECTOR) {
					left = [AST.SELECTOR, [left]];
				}
				left[1].push(tokenizer.next().value);
			}

			else if (tokenizer.next(tokenizer.LBRACKET)) {
				if (tokenizer.next(tokenizer.RBRACKET)) {
					throw new ParseError('expression', '[]');
				}
				if (left[0] !== AST.SELECTOR) {
					left = [AST.SELECTOR, [left]];
				}
				left[1].push(parseExpression());
				if (!tokenizer.next(tokenizer.RBRACKET)) {
					throw new ParseError(']');
				}
			}

			else if (left[0] === AST.SELECTOR &&
				tokenizer.next(tokenizer.LPAREN)) {

				var args = null, name, context;
				if (!tokenizer.next(tokenizer.RPAREN)) {
					args = [];
					while (true) {
						args.push(parseExpression());
						if (!tokenizer.next(tokenizer.COMMA)) break;
					}
					if (!tokenizer.next(tokenizer.RPAREN)) {
						throw new ParseError(')');
					}
				}
				name = left[1].pop();
				context = (left[1].length ? left : null);
				left = [AST.CALL, context, name, args];
			}

			else break;
		}
		return left;
	}

	function parseUnaryExpression() {
		return (tokenizer.next(tokenizer.NOT) && [
			AST.NOT, parseUnaryExpression()
		] || (tokenizer.next(tokenizer.ADD),
			parsePrimaryExpression()
		));
	}

	function parseMulExpression() {
		var left = parseUnaryExpression();
		while (tokenizer.next(tokenizer.MUL) && (
			left = [AST.MUL, left, parseUnaryExpression()]
		) || tokenizer.next(tokenizer.DIV) && (
			left = [AST.DIV, left, parseUnaryExpression()]
		) || tokenizer.next(tokenizer.MOD) && (
			left = [AST.MOD, left, parseUnaryExpression()]
		)){};
		return left;
	}

	function parseAddExpression() {
		var left = parseMulExpression();
		while (tokenizer.next(tokenizer.ADD) && (
			left = [AST.ADD, left, parseMulExpression()]
		) || tokenizer.next(tokenizer.SUB) && (
			left = [AST.SUB, left, parseMulExpression()]
		)){};
		return left;
	}

	function parseRelExpression() {
		var left = parseAddExpression();
		return (tokenizer.next(tokenizer.LESS_OR_EQUAL) && [
			AST.LESS_OR_EQUAL, left, parseAddExpression()
		] || tokenizer.next(tokenizer.LESS_THAN) && [
			AST.LESS_THAN, left, parseAddExpression()
		] || tokenizer.next(tokenizer.GREATER_OR_EQUAL) && [
			AST.GREATER_OR_EQUAL, left, parseAddExpression()
		] || tokenizer.next(tokenizer.GREATER_THAN) && [
			AST.GREATER_THAN, left, parseAddExpression()
		] || left);
	}

	function parseEqExpression() {
		var left = parseRelExpression();
		while (tokenizer.next(tokenizer.IS) && (
			left = [AST.EQUAL, left, parseRelExpression()]
		) || tokenizer.next(tokenizer.NOT_EQUAL) && (
			left = [AST.NOT_EQUAL, left, parseRelExpression()]
		)){};
		return left;
	}

	function parseAndExpression() {
		var left = parseEqExpression();
		while (tokenizer.next(tokenizer.AND) && (
			left = [AST.AND, left, parseEqExpression()]
		)){};
		return left;
	}

	function parseOrExpression() {
		var left = parseAndExpression();
		while (tokenizer.next(tokenizer.OR) && (
			left = [AST.OR, left, parseAndExpression()]
		)){};
		return left;
	}

	function parseTernaryExpression() {
		var left = parseOrExpression();
		while (tokenizer.next(tokenizer.QUERY)) {
			left = [AST.TERNARY, left, parseExpression()];
			if (tokenizer.next(tokenizer.COLON)) left.push(parseExpression());
		}
		return left;
	}

	function parseExpression() {
		return parseTernaryExpression();
	}

	function parseVarStatement() {
		if (!tokenizer.next(tokenizer.VAR)) return;
		var name = tokenizer.next(tokenizer.ID);
		if (!name) throw new ParseError('identifier');
		var expression;
		if (!tokenizer.next(tokenizer.EQUAL)) {
			if (!tokenizer.next(tokenizer.BLOCK_END)) {
				throw new ParseError('}}');
			}
			expression = [
				AST.STATEMENTS,
				parseStatements(tokenizer.DIV)
			];
			if (!tokenizer.next(tokenizer.DIV) ||
				!tokenizer.next(tokenizer.VAR) ||
				!tokenizer.next(tokenizer.BLOCK_END)) {
				throw new ParseError('{{/var}}');
			}
		} else {
			expression = parseExpression();
			if (!tokenizer.next(tokenizer.BLOCK_END)) {
				throw new ParseError('}}');
			}
		}
		return [AST.VAR, name.value, expression];
	}

	function parseIfStatement() {
		if (!tokenizer.next(tokenizer.IF)) return;
		var conditions = [], expression, statements;

		while (true) {
			expression = parseExpression();
			if (!tokenizer.next(tokenizer.BLOCK_END)) {
				throw new ParseError('}}');
			}
			statements = parseStatements(
				tokenizer.DIV,
				tokenizer.ELSE,
				tokenizer.ELSEIF
			);
			conditions.push([expression, statements]);
			if (!tokenizer.next(tokenizer.ELSEIF)) break;
		}

		if (tokenizer.next(tokenizer.ELSE)) {
			if (!tokenizer.next(tokenizer.BLOCK_END)) {
				throw new ParseError('}}');
			}
			statements = parseStatements(tokenizer.DIV);
			conditions.push([[AST.TRUE], statements]);
		}

		if (!tokenizer.next(tokenizer.DIV) ||
			!tokenizer.next(tokenizer.IF) ||
			!tokenizer.next(tokenizer.BLOCK_END)) {
			throw new ParseError('{{/if}}');
		}

		return [AST.IF, conditions];
	}

	function parseForStatement() {
		if (!tokenizer.next(tokenizer.FOR)) return;
		var iterator = tokenizer.next(tokenizer.ID);
		if (!iterator) throw new ParseError('identifier');
		iterator = [iterator.value];

		if (tokenizer.next(tokenizer.COLON)) {
			var key = tokenizer.next(tokenizer.ID);
			if (!key) throw new ParseError('identifier');
			iterator.unshift(key.value);
		}

		if (!tokenizer.next(tokenizer.IN)) throw new ParseError('in');
		var expression = parseExpression();
		if (!tokenizer.next(tokenizer.BLOCK_END)) {
			throw new ParseError('}}');
		}

		var statements = [parseStatements(tokenizer.DIV, tokenizer.ELSE)];
		if (tokenizer.next(tokenizer.ELSE)) {
			if (!tokenizer.next(tokenizer.BLOCK_END)) {
				throw new ParseError('}}');
			}
			statements.push(parseStatements(tokenizer.DIV));
		}

		if (!tokenizer.next(tokenizer.DIV) ||
			!tokenizer.next(tokenizer.FOR) ||
			!tokenizer.next(tokenizer.BLOCK_END)) {
			throw new ParseError('{{/for}}');
		}

		return [AST.FOR, iterator, expression, statements];
	}

	function parseMacroStatement() {
		if (!tokenizer.next(tokenizer.MACRO)) return;
		var name = tokenizer.next(tokenizer.ID);
		if (!name) throw new ParseError('identifier');
		var args = [];
		if (tokenizer.next(tokenizer.LPAREN)) {
			if (!tokenizer.next(tokenizer.RPAREN)) {
				while (true) {
					var arg = tokenizer.next(tokenizer.ID);
					if (!arg) throw new ParseError('identifier');
					args.push(arg.value);
					if (!tokenizer.next(tokenizer.COMMA)) break;
				}
				if (!tokenizer.next(tokenizer.RPAREN)) {
					throw new ParseError(')');
				}
			}
		}

		if (!tokenizer.next(tokenizer.BLOCK_END)) {
			throw new ParseError('}}');
		}

		var statements = parseStatements(tokenizer.DIV);

		if (!tokenizer.next(tokenizer.DIV) ||
			!tokenizer.next(tokenizer.MACRO) ||
			!tokenizer.next(tokenizer.BLOCK_END)) {
			throw new ParseError('{{/macro}}');
		}

		return [AST.MACRO, name.value, args, statements];
	}

	function parseExpressionStatement() {
		var expression = parseExpression();
		if (!tokenizer.next(tokenizer.BLOCK_END)) {
			throw new ParseError('}}');
		}
		return expression;
	}

	function parseStatement() {
		return (
			parseIfStatement() ||
			parseForStatement() ||
			parseVarStatement() ||
			parseMacroStatement() ||
			parseExpressionStatement()
		);
	}

	function parseStatements() {
		var lastFragment = -1;
		var statements = [], statement;
		while (!tokenizer.next(Tokenizer.T_EOF)) {

			// skip comments
			while (tokenizer.next(tokenizer.COMMENT_START)) {
				while (!tokenizer.test(tokenizer.COMMENT_END) &&
					!tokenizer.next(Tokenizer.T_EOF)) {
					tokenizer.next();
				}
				if (!tokenizer.next(tokenizer.COMMENT_END)) {
					throw new ParseError('*}}');
				}
			}

			// parse literals
			while (tokenizer.next(tokenizer.LITERAL_START)) {
				var literalStr = '';
				while (!tokenizer.test(tokenizer.LITERAL_END) &&
					!tokenizer.next(Tokenizer.T_EOF)) {
					literalStr += tokenizer.next().value;
				}
				if (!tokenizer.next(tokenizer.LITERAL_END)) {
					throw new ParseError('%}}');
				}

				if (lastFragment === -1) {
					lastFragment = statements.length;
					statements.push(literalStr);
				} else statements[lastFragment] += literalStr;
			}

			// parse instructions
			if (tokenizer.next(tokenizer.BLOCK_START)) {
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
				if (tokenizer.next(tokenizer.BLOCK_END)) continue;
				lastFragment = -1;
				// parse statements
				statements.push(parseStatement());
			}

			// parse text fragments
			else if (!tokenizer.test(Tokenizer.T_EOF)) {
				if (lastFragment === -1) {
					lastFragment = statements.length;
					statements.push(tokenizer.next().value);
				} else statements[lastFragment] += tokenizer.next().value;
			}
		}
		return statements;
	}

	function parseTemplate(templateStr, baseURI) {
		nestLevel = 0;
		fileName = (baseURI || 'template');
		if (!tokenizer) initialize();
		tokenizer.tokenize(templateStr, T_CTX_TPL);
		return parseStatements();
	}

	return parseTemplate;
});