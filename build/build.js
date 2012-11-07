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
				if (dependencyPath !== 'module') {
					dependencyPath = Files.resolvePath(dependencyPath, fileName);
					buildFileList(dependencyPath, order + 1, defArgs[c]);
				}
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

	var moduleHeader = function(definition, namespace, global) {

		function useExports() {
			return (typeof process === 'object' ||
			typeof Packages === 'object' &&
			typeof JavaImporter === 'function' &&
			typeof module !== "undefined" && (
				!global.module ||
				global.module.id !== module.id
			));
		}

		function useDefine() {
			if (typeof requirejs === 'function' &&
				typeof define === 'function' && define.amd) {
				var script = document.head.getElementsByTagName('script');
				script = Array.prototype.pop.call(script);
				return script.hasAttribute('data-requiremodule');
			}
		}

		if (useDefine()) {
			define(['module'], definition);
		} else if (useExports()) {
			module.exports = definition(module);
		} else {
			global[namespace] = definition();
		}

	};

	var module = ('(' + moduleHeader.toString() + ')(function(module) {');
		module += result;
		module += 'return ' + FUNCTION_NAME + ';';
	module += '}, "' + FUNCTION_NAME + '", function() { return this; }.call(null));';

	return module;
}

var result = buildDependencies(INPUT_PATH, FUNCTION_NAME, function(path) {
	print('processing dependency:', path);
});
print('compiling:', OUTPUT_PATH);
result = Compiler.compile(result);
Files.write(OUTPUT_PATH, result);