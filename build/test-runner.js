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

var ENV_TYPE = (typeof process  === 'object' && (ENV_TYPE = 'node') ||
	typeof Packages === 'object' &&
	typeof JavaImporter === 'function' && (ENV_TYPE = 'rhino') ||
	typeof window !== 'undefined' && (ENV_TYPE = 'browser') ||
	(ENV_TYPE = 'unknown')
);

var print = (print || function() {
	console.info.apply(this, arguments);
});

var readFile = (readFile || function(fileName) {
	var fs = require('fs');
	return fs.readFileSync(fileName);
});

var quit = (quit || function(code) {
	process.exit(code);
});

var getEnv = function(name) {
	if (ENV_TYPE === 'rhino') {
		var value = java.lang.System.getenv(name);
		return (value ? String(value) : null);
	} else if (ENV_TYPE === 'node') {
		return process.env[name];
	}
};

var isDir = function(path) {
	if (ENV_TYPE === 'rhino') {
		var fileRef = new java.io.File(path);
		return (fileRef.isDirectory());
	} else if (ENV_TYPE === 'node') {
		var fs = require('fs');
		var stats = fs.lstatSync(path);
		return stats.isDirectory();
	}
};

var isFile = function(path) {
	if (ENV_TYPE === 'rhino') {
		var fileRef = new java.io.File(path);
		return (fileRef.isFile());
	} else if (ENV_TYPE === 'node') {
		var fs = require('fs');
		var stats = fs.lstatSync(path);
		return stats.isFile();
	}
};

var readDir = function(path, callback) {
	var result = [];
	if (!callback instanceof Function) {
		callback = new Function();
	}

	if (ENV_TYPE === 'rhino') {

		var dirObj = new java.io.File(path);
		if (!dirObj.isDirectory()) return result;

		var files = dirObj.list();
		var absolutePath = (dirObj.getAbsolutePath() + '');
		for (var fileDescr = {}, c = 0; c < files.length; c++) {

			var fileObj = absolutePath;
			fileObj += '/';//FILE_SEPARATOR;
			fileObj += String(files[c]);
			fileObj = new java.io.File(fileObj);

			var filePath = String(fileObj.getCanonicalPath());
			var fileName = String(fileObj.getName());

			if (fileObj.isDirectory()) fileDescr = {
				'type': 'folder', 'name': fileName, 'path': filePath
			}; else if (fileObj.isFile()) fileDescr = {
				'type': 'file', 'name': fileName, 'path': filePath
			};

			if (callback(fileDescr) === false) continue;
			if (fileObj.isDirectory()) {
				fileDescr.files = readDir(filePath, callback);
				if (callback(fileDescr)) result.push(fileDescr);
			} else result.push(fileDescr);
		}

		return result;

	} else if (ENV_TYPE === 'node') {

		var fileDescr;
		var fs = require('fs');
		var files = fs.readdirSync(path);

		for(var i in files) {

			var fileName = files[i];
			var filePath = (path + '/' + fileName);

			if (isDir(filePath)) fileDescr = {
				'type': 'folder', 'name': fileName, 'path': filePath
			}; else if (isFile(filePath)) fileDescr = {
				'type': 'file', 'name': fileName, 'path': filePath
			};

			if (callback(fileDescr) === false) continue;

			if (isDir(filePath)) {
				fileDescr.files = readDir(filePath, callback);
				if (callback(fileDescr)) result.push(fileDescr);
			} else result.push(fileDescr);

		}

		return result;

	}
};


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

		testCounter++;

		ret();
	}

	try {
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

	function forEachAsync(list, iterator, ret) {
		if (!(list instanceof Object)) ret();
		var keys, key, length, last;
		var i = -1, calls = 0, looping = false;
		if (!(list instanceof Array)) {
			keys = Object.keys(list);
			length = keys.length;
		} else {
			length = list.length;
		}
		last = length - 1;
		var resume = function() {
			calls += 1;
			if (looping) return;
			looping = true;
			while (calls > 0) {
				calls -= 1, i += 1;
				if (i === length) return ret();
				key = (keys ? keys[i] : i);
				iterator(list[key], function(stop) {
					if (stop === true) ret();
					else resume();
				}, key, i, last);
			}
			looping = false;
		};
		resume();
	}

function doTest(filePath, ret) {
	var fileType = filePath.split('.').pop();
	if (fileType !== 'json') return ret();
	var testSuites = readFile(filePath);
	testSuites = JSON.parse(testSuites);

	forEachAsync(testSuites, function(testSuite, ret) {
		var suiteName = testSuite.name;
		var testCases = testSuite.cases;
		print('\n[ "' + filePath + '" -> "' + suiteName + '"]\n');
		forEachAsync(testCases, function(testCase, ret) {
			runTestCase(testCase, filePath, ret);
		}, ret);
	}, ret);
}

function quitWithResult() {
	print();
	print('EXECUTED:', testCounter, 'test cases');
	print('SUCCESS:', successCases, 'test cases');
	print('FAILED:', failedCases, 'test cases');
	print('SKIPPED:', skippedCases, 'test cases');
	print();
	quit(failedCases !== 0);
}

var testPath = getEnv('tests');

if (isDir(testPath)) {

	var files = [];
	readDir(testPath, function(file) {
		if (file.type === 'folder') {
			return (file.name !== 'testresources');
		} else if (file.type === 'file') {
			if (file.name === 'map.toQueryString.json') return;
		}
		files.push(file.path);
	});

	forEachAsync(files, function(file, ret) {
		doTest(file, ret);
	}, quitWithResult);

} else if (isFile(testPath)) {
	doTest(testPath, quitWithResult);
} else {
	print(testPath, 'doesn\'t exist!');
	quit(1);
}