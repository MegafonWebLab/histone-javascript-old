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

var Utils = require('Utils');
var Files = require('Files');
var ClosureCompiler = require('ClosureCompiler');

var FUNCTION_NAME = 'Histone';
var INPUT_PATH = Utils.getEnv('input');
var OUTPUT_PATH = Utils.getEnv('output');

function moduleHeader(definition, namespace, global) {

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
			return (
				script instanceof Object &&
				script.hasAttribute instanceof Function &&
				script.hasAttribute('data-requiremodule')
			);
		}
	}

	if (useDefine()) {
		define(['module'], definition);
	} else if (useExports()) {
		module.exports = definition(module);
	} else {
		global[namespace] = definition();
	}
}

function executePlugin(pluginPath, pluginArgs, baseURI) {
	var pluginStr = '';
	print('processing plugin:', pluginPath);
	var pluginBody = makeBundle(pluginPath, 'PLUGIN');
	pluginBody = new Function(pluginBody + ' return PLUGIN;')();
	pluginBody.build(pluginArgs, baseURI, function(result) {
		pluginStr = result;
	});
	return pluginStr;
}

function makeBundle(fileName, exportAs) {

	var bundleStr = '';
	var dependencies = {};

	function storeDependency(fileName, exportAs, definition, order) {
		if (!dependencies.hasOwnProperty(fileName)) {
			print('processing dependency:', fileName);
			dependencies[fileName] = {
				order: order,
				exportAs: {},
				body: definition
			};
		} else dependencies[fileName].order++;
		if (exportAs && !dependencies[fileName]
			['exportAs'].hasOwnProperty(exportAs)) {
			dependencies[fileName]['exportAs'][exportAs] = true;
		}
	}

	function buildDependencies(fileName, callback, order, exportAs) {
		if (order === undefined) order = 0;
		var fileContents = readFile(fileName);
		new Function('define', fileContents)(function() {
			var dependencyNames = [], dependencyPaths = [];
			var args = Array.prototype.slice.call(arguments);
			if (Utils.isArray(args[0])) dependencyPaths = args.shift();
			var definition = args.shift();
			if (Utils.isFunction(definition)) {
				dependencyNames = Utils.getFunctionArguments(definition);
				definition = Utils.setFunctionArguments(definition);
			}
			storeDependency(fileName, exportAs, definition, order);
			for (var c = 0; c < dependencyPaths.length; c++) {
				var dependencyPath = dependencyPaths[c];
				if (dependencyPath === 'module') continue;
				if (dependencyPath.indexOf('!') !== -1 &&
					Utils.isFunction(callback)) {
					var pluginPath = dependencyPath;
					if (pluginPath[0] === '!') {
						pluginPath = pluginPath.substr(1);
					}
					pluginPath = pluginPath.split('!');
					var pluginArgs = pluginPath.slice(1).join('!');
					pluginPath = pluginPath.shift();
					pluginPath = Utils.resolveURI(pluginPath, fileName);
					fileContents = callback(pluginPath, pluginArgs, fileName);
					storeDependency(
						dependencyPath,
						dependencyNames[c],
						fileContents, order + 1
					);
				} else {
					buildDependencies(
						Utils.resolveURI(dependencyPath, fileName),
						callback, order + 1, dependencyNames[c]
					);
				}
			}
		});
	}

	buildDependencies(fileName, executePlugin);
	dependencies[fileName]['exportAs'][exportAs] = true;

	var dependencyData = [];
	for (var dependencyPath in dependencies) {
		var dependency = dependencies[dependencyPath];
		dependencyData.push(dependency);
	}

	dependencyData.sort(function(a, b) {
		return (b.order - a.order);
	});

	while (dependencyData.length) {
		var exportAs = null;
		var dependency = dependencyData.shift();
		for (var exportVar in dependency.exportAs) {
			bundleStr += 'var ';
			bundleStr += exportVar;
			if (!exportAs) {
				if (Utils.isFunction(dependency.body)) {
					bundleStr += ' = (';
					bundleStr += Utils.setFunctionArguments(dependency.body);
					bundleStr += ')();';
				} else {
					bundleStr += ' = (';
					bundleStr += JSON.stringify(dependency.body);
					bundleStr += ');'
				}
				exportAs = exportVar;
			} else {
				bundleStr += ' = ';
				bundleStr += exportAs;
				bundleStr += ';';
			}
			bundleStr += '\n';
		}
	}

	return bundleStr;
}

function compileBundle(fileName, exportAs) {
	var module = ('(' + moduleHeader.toString() + ')(function(module) {');
	module += makeBundle(fileName, exportAs);
	module += 'return ' + exportAs + ';';
	module += '}, "' + exportAs + '", function() { return this; }.call(null));';
	return module;
}

var bundleStr = compileBundle(INPUT_PATH, FUNCTION_NAME);
print('compiling:', OUTPUT_PATH);
bundleStr = ClosureCompiler.processString(bundleStr);
Files.write(OUTPUT_PATH, bundleStr);