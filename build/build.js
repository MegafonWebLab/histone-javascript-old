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

var [Utils, Files, Compiler, JSParser] = [
	require('Utils'),
	require('Files'),
	require('Compiler'),
	require('JSParser')
];

var FUNCTION_NAME = 'Histone';
var INPUT_PATH = Utils.getEnv('input');
var OUTPUT_PATH = Utils.getEnv('output');
var OUTPUT_TYPE = Utils.getEnv('result');

function rewriteDefinition(fileName, moduleName, dependencies) {
	var fileData = Files.read(fileName);
	if (!Utils.isString(moduleName)) moduleName = '';
	if (!Utils.isObject(dependencies)) dependencies = {};
	var found = false;
	JSParser.parse(fileName, fileData, function(treeNode) {
		var nodeType = JSParser.getType(treeNode);
		// process only function calls
		if (nodeType !== 'call') return;
		var functionCall = JSParser.parseNode(treeNode);
		// process only define calls
		if (functionCall.name !== 'define') return;
		var functionArgs = functionCall.args;
		var functionArity = functionArgs.length;
		// process only anonymous define calls
		if (functionArity && functionArgs[0].type === 'string') return;
		found = true;
		var definition = 'define(';
		if (moduleName) definition += '\'' + moduleName + '\', ';
		for (var c = 0; c < functionArity; c++) {
			var functionArg = functionArgs[c];

			if (functionArg.type === 'arraylit') {
				var arrayItems = [];
				for (var i = 0; i < functionArg.value.length; i++) {
					if (!dependencies[functionArg.value[i].value]) {
						arrayItems.push(functionArg.value[i].toString());
					} else {
						arrayItems.push('\'' + dependencies[functionArg.value[i].value] + '\'');
					}
				}
				definition += '[' + arrayItems + ']';
			} else {
				definition += functionArg.toString();
			}


			if (c < functionArity - 1) definition += ',';
		}
		definition += ');';
		fileData = fileData.substr(
			0, treeNode.absolutePosition
		) + definition + fileData.substr(
			treeNode.absolutePosition +
			treeNode.length
		);
		return true;
	});
	if (!found) {
		fileData = 'define(\'' + moduleName + '\');' + fileData;
	}
	return fileData;
}

function getModuleInfo(modulePath) {
	var resultDeps = [];
	var module = new Function('define', Files.read(modulePath));
	module(function() {
		var deps = [];
		var args = Utils.args2arr(arguments);
		if (args.length >= 2) {
			if (Utils.isArray(args[0])) deps = args[0];
		}
		for (var c = 0; c < deps.length; c++) {
			var dep = deps[c];
			if (dep.substr(-3) !== '.js') dep += '.js';
			dep = Files.resolvePath(dep, modulePath);
			if (Files.exists(dep)) {
				var fileDeps = getModuleInfo(dep);
				resultDeps.unshift({
					path: dep,
					name: deps[c]
				});
				resultDeps = fileDeps.deps.concat(resultDeps);
			} else print(
				'Couldn\'t find dependency:',
				dep, 'in ' + modulePath
			);
		}
	});
	return {deps: resultDeps};
}

function buildDependencies(modulePath) {

	var dependencyPath;
	var buildResult = [];
	var dependenciesMap = {};
	var moduleInfo = getModuleInfo(modulePath);
	var moduleDeps = moduleInfo.deps;

	for (var c = 0; c < moduleDeps.length; c++) {
		dependenciesMap[moduleDeps[c].name] = Utils.uniqueId();
	}

	for (var c = 0; c < moduleDeps.length; c++) {
		dependencyPath = moduleDeps[c].path;
		print('Processing dependency:', dependencyPath);
		buildResult.push(rewriteDefinition(
			dependencyPath,
			dependenciesMap[moduleDeps[c].name],
			dependenciesMap
		));
	}
	buildResult.push(rewriteDefinition(
		modulePath, null, dependenciesMap
	));
	return buildResult.join('');
}

var data = buildDependencies(INPUT_PATH);

if (OUTPUT_TYPE === 'function') {
	var result = [];
	(new Function('define', data))(function() {
		var name = 'Result', deps = [], value = '';
		for (var c = 0; c < arguments.length; c++) {
			if (Utils.isString(arguments[c])) {
				name = arguments[c];
			} else if (Utils.isArray(arguments[c])) {
				deps = arguments[c];
			} else {
				value = arguments[c];
				break;
			}
		}
		result.push('var ' + name + ' = (' +
			value.toString() +
		')(' + deps.toString() + ');');
	});

	data = '(function(window, undefined) {' +
		result.join('') +
		'window["'+FUNCTION_NAME+'"] = Result;' +
	'})(function() { return this; }.call(null));'
}

print('Compiling...');
data = Compiler.compile(data);
Files.write(OUTPUT_PATH, data);



