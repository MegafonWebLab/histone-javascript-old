/**
 * test.js - Histone template engine.
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

load('Histone.js');
var testResult = 0;
var Files = require('Files');
var registeredFunctions = [];

function registerFunction(type, name, result, exception) {
	var nodeType = (
		type === 'map' ? Histone.Map :
		type === 'type' ? Histone.Type :
		type === 'number' ? Histone.Number :
		type === 'string' ? Histone.String :
		Histone.Global
	);
	registeredFunctions.push({
		name: name,
		target: nodeType,
		value: nodeType[name]
	});
	nodeType[name] = function(value, args, ret) {
		if (typeof exception !== 'undefined')  {
			throw exception;
		}
		if (typeof result === 'string') {
			Histone(result).render(ret, {
				target: value,
				args: args
			});
		} else ret(result);
	};
}

function registerProperty(type, name, result, exception) {
	registerFunction(type, name, result, exception);
}

function unregisterFunctions() {
	while (registeredFunctions.length) {
		var registeredFunction = registeredFunctions.shift();
		registeredFunction.target[
			registeredFunction.name
		] = registeredFunction.value;
	}
}

function unregisterProperties() {
	unregisterFunctions();
}

function testParserExpected(input, testCase) {
	var expected = testCase.expected;
	expected = JSON.stringify(expected);
	try {
		var result = Histone(input);
		result = JSON.stringify(result.getAST());
		return (expected === result);
	} catch (e) { return false; }
}

function testParserException(input, testCase) {
	var exception = testCase.exception;
	try { Histone(input); } catch (error) {
		for (var key in exception) {
			if (!error.hasOwnProperty(key)) continue;
			if (String(error[key]) !==
				String(exception[key])) {
				return false;
			}
		}
		return true;
	}
	return false;
}

function testEvaluatorExpected(input, testCase, callback) {
	var context = testCase.context;
	var expected = testCase.expected;

	if (testCase.hasOwnProperty('function')) {
		var functionDefs = testCase.function;
		if (!(functionDefs instanceof Array)) {
			functionDefs = [functionDefs];
		}
		for (var c = 0; c < functionDefs.length; c++) {
			var functionDef = functionDefs[c];
			registerFunction(
				functionDef.node,
				functionDef.name,
				functionDef.result,
				functionDef.exception
			);
		}
	}

	if (testCase.hasOwnProperty('property')) {
		var propertyDefs = testCase.property;
		if (!(propertyDefs instanceof Array)) {
			propertyDefs = [propertyDefs];
		}
		for (var c = 0; c < propertyDefs.length; c++) {
			var propertyDef = propertyDefs[c];
			registerProperty(
				propertyDef.node,
				propertyDef.name,
				propertyDef.result,
				propertyDef.exception
			);
		}
	}

	try {
		var result = false;
		var template = Histone(input);
		template.render(function(result) {
			unregisterFunctions();
			unregisterProperties();
			callback(expected === result);
		}, context);
	} catch (e) {
		unregisterFunctions();
		unregisterProperties();
		callback(false);
	}
}

function printSuccess(message) {
	var message = JSON.stringify(message);
	message = message.substr(1);
	message = message.substr(0, message.length - 1);
	print('     [ SUCCESS ] ', message);
}

function printFail(message) {
	var message = JSON.stringify(message);
	message = message.substr(1);
	message = message.substr(0, message.length - 1);
	print('---- [ FAILING ] ', message);
}

Files.readDir('histone-acceptance-tests/src/main/acceptance', function(file) {
	//'/Users/ruslan/Sites/externals/histone-acceptance-tests.git/trunk/src/main/acceptance/'

	if (file.type === 'folder') {
		if (file.name === 'evaluator') return true;
		if (file.name === 'parser') return true;
		return false;
	}
	var fileType = file.name.split('.').pop();
	if (fileType !== 'json') return;
	// if (file.name !== 'global-scope.json') return;


	// if (file.name === 'constructs.json') {
	// 	var testSuites = readFile(file.path);
	// 	testSuites = JSON.parse(testSuites);
	// 	for (var i = 0; i < testSuites.length; i++) {
	// 		var testSuite = testSuites[i];
	// 		print('TESTING:', testSuite.name);
	// 		for (var j = 0; j < testSuite.cases.length; j++) {
	// 			var testCase = testSuite.cases[j];
	// 			if (!testCase.context) continue;
	// 			testCase.context = JSON.parse(testCase.context);
	// 		}
	// 	}
	//
	// 	print(JSON.stringify(testSuites));
	// }

	var testSuites = readFile(file.path);
	testSuites = JSON.parse(testSuites);

	for (var i = 0; i < testSuites.length; i++) {
		var testSuite = testSuites[i];
		print('\n[ TESTING "' + testSuite.name + '" ]\n');
		for (var j = 0; j < testSuite.cases.length; j++) {
			var testCase = testSuite.cases[j];
			var input = testCase.input;
			if (testCase.hasOwnProperty('expected')) {
				if (testCase.expected instanceof Array) {
					if (testParserExpected(input, testCase)) {
						printSuccess(input);
					} else {
						testResult = 1;
						printFail(input);
					}
				} else testEvaluatorExpected(
					input, testCase, function(result) {
						if (result) {
							printSuccess(input);
						} else {
							testResult = 1;
							printFail(input);
						}
					}
				);
			}
			else if (testCase.hasOwnProperty('exception')) {
				if (testParserException(input, testCase)) {
					printSuccess(input);
				} else {
					testResult = 1;
					printFail(input);
				}
			}
		}
	}

});

quit(testResult);