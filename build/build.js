/**
 * build.js - Histone template engine.
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

var [Utils, Files, Compiler] = [
	require('Utils'),
	require('Files'),
	require('Compiler')
];

var FUNCTION_NAME = 'Histone';
var INPUT_PATH = Utils.getEnv('input');
var OUTPUT_PATH = Utils.getEnv('output');

function buildDependencies(fileName, exportAs, callback) {

	var result = '';
	var dependencyPaths = {};

	var buildFileList = function(fileName, order, exportAs) {
		if (order === undefined) order = 0;
		var inputFile = readFile(fileName);
		new Function('define', inputFile)(function() {

			var dependencies = [];
			var args = Array.prototype.slice.call(arguments);
			var definition = args.pop();
			if (args.length) dependencies = args.pop();

			if (!dependencyPaths.hasOwnProperty(fileName)) {
				if (callback instanceof Function) callback(fileName);
				dependencyPaths[fileName] = {
					order: order,
					exportAs: {},
					body: definition
				};
			} else {
				dependencyPaths[fileName].order++;
			}

			if (exportAs && !dependencyPaths[fileName]
				['exportAs'].hasOwnProperty(exportAs)) {
				dependencyPaths[fileName]['exportAs'][exportAs] = true;
			}

			var defArgs = Utils.getFunctionArguments(definition);
			for (var c = 0; c < dependencies.length; c++) {
				var dependencyPath = dependencies[c];
				dependencyPath = Files.resolvePath(dependencyPath, fileName);
				buildFileList(dependencyPath, order + 1, defArgs[c]);
			}

		});
	};

	buildFileList(fileName);
	dependencyPaths[fileName].exportAs[exportAs] = true;

	var dependencies = [];
	for (var dependencyPath in dependencyPaths) {
		var dependency = dependencyPaths[dependencyPath];
		dependencies.push(dependency);
	}

	dependencies.sort(function(a, b) {
		return (b.order - a.order);
	});

	Utils.print(dependencies);

	while (dependencies.length) {
		var dependency = dependencies.shift();
		var exportAs = null;
		for (var exportVar in dependency.exportAs) {
			result += 'var ';
			result += exportVar;
			if (!exportAs) {
				result += ' = (';
				result += Utils.setFunctionArguments(dependency.body);
				result += ')();';
				exportAs = exportVar;
			} else {
				result += ' = ';
				result += exportAs;
				result += ';';
			}
			result += '\n';
		}
	}

	var header = '(\n';
		header += '\ttypeof requirejs === "function" &&\n';
		header += '\ttypeof define === "function" &&\n';
		header += '\tdefine.amd instanceof Object\n';
	header += '? define : function(definition, global) {\n';
		header += '\tvar definition = definition();\n';
		header += '\tif (typeof process === "object" &&\n';
		header += '\t\ttypeof process.versions === "object" &&\n';
		header += '\t\ttypeof process.versions.node === "string") {\n';
			header += '\t\t\tmodule.exports = definition;\n';
		header += '\t\t} else global["' + FUNCTION_NAME + '"] = definition;\n'
	header += '})(function() {\n';
	result = header + result;
	result += 'return ' + FUNCTION_NAME + ';';
	result += '}, function() { return this; }.call(null));'

	return result;
}

var result = buildDependencies(INPUT_PATH, FUNCTION_NAME, function(path) {
	print('processing dependency:', path);
});
print('compiling:', OUTPUT_PATH);
result = Compiler.compile(result);
Files.write(OUTPUT_PATH, result);