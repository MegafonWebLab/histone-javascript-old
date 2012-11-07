/**
 * Tokenizer.js - Histone template engine.
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

define(function() {

	var T_EOF = -1,
	T_FRAGMENT = 0,
	T_KIND_IGNORE = 1,
	T_KIND_TOKEN = 2,
	T_KIND_LITERAL = 3;

	var Tokenizer = function() {

		var lastTokenId = 0;
		var transitions = {};
		var tokenStrings = {};
		var tokenDefinitions = {};

		var inputString, inputStringLength;
		var tokenOffset, tokenBuffer, tokenBufferLength;
		var currentToken, currentTokenType, currentContext;
		var match, matchLength, gIndex, matchIndex;
		var textData, textLength, tokenDef, tokenInfo;

		function processToken() {
			if (tokenOffset !== inputStringLength) {
				tokenDef = tokenDefinitions[currentContext];
				if (match = tokenDef[0].exec(inputString)) {
					matchLength = match.length;
					for (gIndex = 1; gIndex < matchLength; gIndex++) {
						textData = match[gIndex];
						if (!textData) continue;
						matchIndex = match.index;
						if (textLength = matchIndex - tokenOffset) {
							tokenBufferLength = tokenBuffer.push({
								type: T_FRAGMENT,
								pos: tokenOffset,
								value: inputString.substr(
									tokenOffset, textLength
								)
							});
							tokenOffset += textLength;
						}
						textLength = textData.length;
						tokenOffset = (matchIndex + textLength);
						tokenInfo = tokenDef[1][gIndex - 1];
						switch (tokenInfo[0]) {
							case T_KIND_TOKEN:
								tokenBufferLength = tokenBuffer.push({
									type: tokenInfo[1],
									pos: matchIndex,
									value: textData
								});
								break;
							case T_KIND_LITERAL:
								tokenBufferLength = tokenBuffer.push({
									type: tokenInfo[1],
									pos: matchIndex,
									len: textLength
								});
								break;
							default: processToken();
						}
						break;
					}
				} else if (textLength = inputStringLength - tokenOffset) {
					tokenBufferLength = tokenBuffer.push({
						type: T_FRAGMENT,
						pos: tokenOffset,
						value: inputString.substr(
							tokenOffset, textLength
						)
					});
					tokenOffset += textLength;
				}
			} else {
				tokenBufferLength = tokenBuffer.push({
					type: T_EOF,
					value: 'EOF',
					pos: inputStringLength
				});
			}
		}

		function nextToken() {
			if (!tokenBufferLength) processToken();
			tokenBufferLength--;
			currentToken = tokenBuffer.shift();
			currentTokenType = currentToken.type;
			if (!transitions.hasOwnProperty(currentTokenType)) return;
			var newContext = transitions[currentTokenType];
			if (typeof newContext === 'function') newContext = newContext();
			if (currentContext === newContext) return;
			tokenDefinitions[newContext][0].lastIndex =
			tokenDefinitions[currentContext][0].lastIndex;
			currentContext = newContext;
		}

		function addTokens(tokens, kind, contexts) {
			if (typeof(tokens) !== 'object') tokens = [tokens];
			if (contexts === undefined) contexts = 0;
			if (!(contexts instanceof Array)) contexts = [contexts];

			lastTokenId++;

			for (var c = 0; c < contexts.length; c++) {

				var context = contexts[c];

				if (!tokenStrings[context]) tokenStrings[context] = [];
				if (!tokenDefinitions[context]) {
					tokenDefinitions[context] = [[], []];
				}
				tokenStrings[context].push('(' + tokens.join('|') + ')');
				tokenDefinitions[context][1].push([kind, lastTokenId]);
			}

			return lastTokenId;
		}

		this.addToken = function(tokens, context) {
			return addTokens(tokens, T_KIND_TOKEN, context);
		};

		this.addLiteral = function(literals, context) {
			return addTokens(literals, T_KIND_LITERAL, context);
		};

		this.addIgnore = function(ignores, context) {
			return addTokens(ignores, T_KIND_IGNORE, context);
		};

		this.tokenize = function(input, context) {
			tokenOffset = 0;
			tokenBuffer = [];
			tokenBufferLength = 0;
			currentToken = null;
			currentTokenType = null;
			inputString = input;
			inputStringLength = input.length;
			if (context === undefined) context = 0;
			currentContext = context;
			for (var context in tokenDefinitions) {
				tokenDefinitions[context][0] = new RegExp(
					tokenStrings[context].join('|'), 'g'
				);
			}
			nextToken();
		};

		this.addTransition = function(token, context) {
			if (context === undefined) context = 0;
			transitions[token] = context;
		};

		this.getLineNumber = function() {
			var pos = -1, lineNumber = 1, code;
			var currentPos = currentToken.pos;
			while (++pos < currentPos) {
				code = inputString.charCodeAt(pos);
				if (code === 10 || code === 13) lineNumber++;
			}
			return lineNumber;
		};

		this.getFragment = function() {
			return (
				currentToken.value ?
				currentToken.value :
				inputString.substr(
					currentToken.pos,
					currentToken.len
				)
			);
		};

		this.test = function(tokenType) {
			return (currentToken.type === tokenType);
		};

		this.next = function(tokenType) {
			if (tokenType === undefined ||
				this.test(tokenType)) {
				var token = currentToken;
				return (nextToken(), token);
			}
		};

	};

	Tokenizer.T_EOF = T_EOF;
	Tokenizer.T_FRAGMENT = T_FRAGMENT;

	return Tokenizer;

});