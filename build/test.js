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
var Files = require('Files');
var Utils = require('Utils');
var testResult = 0;
var registeredFunctions = [];

function printMessage(type, message) {
	var message = JSON.stringify(message);
	message = message.substr(1);
	message = message.substr(0, message.length - 1);
	print('     [ ' + type + ' ] ', message);
}

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
			Histone(result).render(function(rrr) {
				print('rrr', rrr);
				ret(rrr);
			}, {
				target: value,
				args: args
			});
		} else ret(result);
	};
}

function unregisterFunctions() {
	while (registeredFunctions.length) {
		var registeredFunction = registeredFunctions.shift();
		registeredFunction.target[
			registeredFunction.name
		] = registeredFunction.value;
	}
}

function runTestCase(testCase, testCaseURL) {
	var template, actualException,
		actualAST, actualResult;

	var isProcessed = false;

	if (typeof(testCase['function']) === 'object') {
		var functionDef;
		var functionDefs = testCase['function'];
		if (!(functionDefs instanceof Array)) {
			functionDefs = [functionDefs];
	 	}
		while (functionDefs.length) {
			functionDef = functionDefs.shift();
			registerFunction(
				functionDef.node,
				functionDef.name,
				functionDef.result,
				functionDef.exception
			);
		}
	}

	if (typeof(testCase['property']) === 'object') {
		var functionDef;
		var functionDefs = testCase['property'];
		if (!(functionDefs instanceof Array)) {
			functionDefs = [functionDefs];
	 	}
		while (functionDefs.length) {
			functionDef = functionDefs.shift();
			registerFunction(
				functionDef.node,
				functionDef.name,
				functionDef.result,
				functionDef.exception
			);
		}
	}

	try {
		template = Histone(
			testCase.input,
			testCaseURL
		);
		actualAST = template.getAST();
		template.render(function(result) {
			actualResult = result;
		}, testCase.context);
	} catch (exception) {
		actualException = exception;
	}

	unregisterFunctions();

	if (template && testCase.expectedAST instanceof Array) {
		isProcessed = true;
		actualAST = JSON.stringify(template.getAST());
		var expectedAST = JSON.stringify(testCase.expectedAST);
		if (expectedAST !== actualAST) {
			testResult = 1;
			return printMessage('FAILING', (
				'expected AST is:' + expectedAST +
				'actual AST is:' + actualAST
			));
		}
	}

	if (!actualException && typeof(testCase.expectedResult) === 'string') {
		isProcessed = true;
		if (testCase.expectedResult !== actualResult) {
			testResult = 1;
			return printMessage('FAILING', (
				'expected result is:' + testCase.expectedResult +
				'actual result is:' + actualResult
			));
		}
	}

	if (testCase.expectedException instanceof Object) {
		isProcessed = true;
		if (!actualException) {
			testResult = 1;
			return printMessage('FAILING', (
				'expected exception:' +
				JSON.stringify(testCase.expectedException)
			));
		}
		for (var expectedKey in testCase.expectedException) {
			if (!actualException.hasOwnProperty(expectedKey) ||
				String(actualException[expectedKey]) !==
				String(testCase.expectedException[expectedKey])) {
				testResult = 1;
				return printMessage('FAILING', (
					'expected exception is:' +
					JSON.stringify(testCase.expectedException) +
					'actual exception is:' +
					JSON.stringify(actualException)
				));
			}
		}
	}

	if (isProcessed) {
		printMessage('SUCCESS', testCase.input);
	} else {
		printMessage('SKIPPED', testCase.input);
	}

};

var testsDir = Utils.getEnv('tests');
if (!testsDir) testsDir = 'histone-acceptance-tests/src/main/acceptance';

Files.readDir(testsDir, function(file) {

	if (file.type === 'folder') {
		if (file.name === 'functions') return true;
		return false;
	}

	var fileType = file.name.split('.').pop();
	if (fileType !== 'json') return;

	var testSuites = readFile(file.path);
	testSuites = JSON.parse(testSuites);

	while (testSuites.length) {
		var testSuite = testSuites.shift();
		var suiteName = testSuite.name;
		var testCases = testSuite.cases;
		print('\n[ "' + file.name + '" -> "' + suiteName + '"]\n');
		while (testCases.length) {
			runTestCase(
				testCases.shift(),
				file.path
			);
		}
	}

});

quit(testResult);