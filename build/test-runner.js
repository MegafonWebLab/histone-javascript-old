/**
 * test-runner.js - Histone template engine.
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

var Files = require('Files');
var Utils = require('Utils');
var System = require('System');
var SocketServer = require('SocketServer');


var socketServer = new SocketServer('127.0.0.1', 4442);

socketServer.start(function(request) {

	var requestHeaders = request.headers;
	for (var key in requestHeaders) {
		var value = requestHeaders[key];
		delete requestHeaders[key];
		key = key.toLowerCase();
		requestHeaders[key] = value;
	}

	return {code: 200, headers: {
		'Content-type': 'application/javascript'
	}, body: JSON.stringify(request)};
});

// socketServer.stop();

var Histone = require('../Histone');

var failedCases = 0;
var testCounter = 0;
var skippedCases = 0;
var successCases = 0;
var registeredFunctions = [];

function printMessage(type, message) {
	var message = JSON.stringify(message);
	message = message.substr(1);
	message = message.substr(0, message.length - 1);
	System.print('     [ ' + type + ' ] ', message);
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

function runTestCase(testCase, testCaseURL, ret) {
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

	function processResults() {
		unregisterFunctions();

		if (template && testCase.expectedAST instanceof Array) {
			isProcessed = true;
			actualAST = template.getAST();
			actualAST = JSON.stringify(actualAST[1]);
			var expectedAST = JSON.stringify(testCase.expectedAST);
			if (expectedAST !== actualAST) {
				failedCases++;
				printMessage('FAILING', (
					'expected AST is:' + expectedAST +
					'actual AST is:' + actualAST
				));
				return ret();
			}
		}

		if (!actualException && typeof(testCase.expectedResult) === 'string') {
			isProcessed = true;
			if (testCase.expectedResult !== actualResult) {
				failedCases++;
				printMessage('FAILING', (
					'expected result is:' + testCase.expectedResult +
					'actual result is:' + actualResult
				));
				return ret();
			}
		}

		if (testCase.expectedException instanceof Object) {
			isProcessed = true;
			if (!actualException) {
				failedCases++;
				printMessage('FAILING', (
					'expected exception:' +
					JSON.stringify(testCase.expectedException)
				));
				return ret();
			}
			for (var expectedKey in testCase.expectedException) {
				if (!actualException.hasOwnProperty(expectedKey) ||
					String(actualException[expectedKey]) !==
					String(testCase.expectedException[expectedKey])) {
					failedCases++;
					printMessage('FAILING', (
						'expected exception is:' +
						JSON.stringify(testCase.expectedException) +
						'actual exception is:' +
						JSON.stringify(actualException)
					));
					return ret();
				}
			}
		}

		if (isProcessed) {
			successCases++;
			printMessage('SUCCESS', testCase.input);
		} else {
			printMessage('SKIPPED', testCase.input);
			skippedCases++;
		}


		ret();
	}

	try {
		testCounter++;
		template = Histone(
			testCase.input,
			testCaseURL
		);
		actualAST = template.getAST();
		return template.render(function(result) {
			actualResult = result;
			processResults();
		}, testCase.context);
	} catch (exception) {
		actualException = exception;
	}

	processResults();


};

function doTest(filePath, ret) {
	var fileType = filePath.split('.').pop();
	if (fileType === 'json') {
		var testSuites = Files.read(filePath);
		testSuites = JSON.parse(testSuites);
		Utils.forEachAsync(testSuites, function(testSuite, ret) {
			var suiteName = testSuite.name;
			var testCases = testSuite.cases;
			System.print('\n[ "' + filePath + '" -> "' + suiteName + '"]\n');
			Utils.forEachAsync(testCases, function(testCase, ret) {
				runTestCase(testCase, filePath, ret);
			}, ret);
		}, ret);
	} else return ret();
}

function quitWithResult() {
	System.print();
	System.print('EXECUTED:', testCounter, 'test cases');
	System.print('SUCCESS:', successCases, 'test cases');
	System.print('FAILED:', failedCases, 'test cases');
	System.print('SKIPPED:', skippedCases, 'test cases');
	System.print();
	System.quit(failedCases !== 0);
}

var testPath = System.getEnv('tests');

if (Files.isDir(testPath)) {

	var files = [];
	Files.readDir(testPath, function(file) {
		if (file.type === 'folder') {
			return (file.name !== 'testresources');
		} else if (file.type === 'file') {
		}
		files.push(file.path);
	});

	Utils.forEachAsync(files, function(file, ret) {
		doTest(file, ret);
	}, quitWithResult);

} else if (Files.isFile(testPath)) {
	doTest(testPath, quitWithResult);
} else {
	System.print(testPath, 'doesn\'t exist!');
	System.quit(1);
}