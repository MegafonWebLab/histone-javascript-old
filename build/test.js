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

const Java = JavaImporter(
	java.io.File,
	java.net.URI,
	java.io.FileWriter,
	java.io.PrintWriter,
	java.io.FileInputStream,
	java.io.FileOutputStream,
	org.w3c.dom.NodeList,
	javax.xml.parsers.DocumentBuilderFactory,
	javax.xml.xpath.XPathFactory,
	javax.xml.xpath.XPathConstants
);

function readDir(path, callback) {
	var result = [];
	if (!callback) callback = function() {};
	var dirObj = new java.io.File(path);
	if (dirObj.isDirectory()) {
		var files = dirObj.list();
		var absolutePath = (dirObj.getAbsolutePath() + '');
		for (var fileDescr = {}, c = 0; c < files.length; c++) {
			var filePath = absolutePath.concat('/', String(files[c]));
			var fileObj = new java.io.File(filePath);
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
	}
	return result;
};

var testResult = 0;

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
	try {
		var result = false;
		var template = Histone(input);
		template.render(function(result) {
			callback(expected === result);
		}, context);
	} catch (e) { callback(false); }
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

readDir('histone-acceptance-tests/src/main/acceptance', function(file) {
	if (file.type === 'folder') {
		if (file.name === 'evaluator') return true;
		if (file.name === 'parser') return true;
		return false;
	}
	var fileType = file.name.split('.').pop();
	if (fileType !== 'json') return;


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