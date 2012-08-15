var [Utils, Files, Compiler, JSParser] = [
	require('Utils'),
	require('Files'),
	require('Compiler'),
	require('JSParser')
];

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
	var buildInfo = null;
	var resultDeps = [];
	var module = new Function('define', Files.read(modulePath));
	module(function() {
		var deps = [];
		var args = Utils.args2arr(arguments);
		if (args.length >= 2) {
			if (Utils.isArray(args[0])) deps = args[0];
			if (args.length === 2) buildInfo = args[1];
			else buildInfo = args[2];
		}
		for (var c = 0; c < deps.length; c++) {
			var dep = (deps[c] + '.js');
			dep = Files.resolvePath(dep, modulePath);
			if (Files.exists(dep)) {
				var fileDeps = getModuleInfo(dep);
				resultDeps.unshift({
					path: dep,
					name: deps[c],
					info: fileDeps.info
				});
				resultDeps = fileDeps.deps.concat(resultDeps);
			} else {
				resultDeps.unshift({
					path: dep,
					name: deps[c],
					info: 'DO_NOT_COMPILE'
				});
			}
		}
	});
	return {
		info: buildInfo,
		deps: resultDeps
	};
}

function buildDependencies(modulePath) {

	var moduleInfo = getModuleInfo(modulePath);
	var moduleDeps = moduleInfo.deps;

	var dependenciesMap = {};
	for (var c = 0; c < moduleDeps.length; c++) {
		if (moduleDeps[c].info === 'DO_NOT_COMPILE') continue;
		dependenciesMap[moduleDeps[c].name] = Utils.uniqueId();
	}

	var buildResult = [];
	for (var c = 0; c < moduleDeps.length; c++) {
		if (moduleDeps[c].info === 'DO_NOT_COMPILE') continue;
		var a = rewriteDefinition(
			moduleDeps[c].path,
			dependenciesMap[moduleDeps[c].name],
			dependenciesMap
		);
		buildResult.push(a);
	}

	buildResult.push(rewriteDefinition(
		modulePath, null, dependenciesMap
	));

	return buildResult.join('');
}

var data = buildDependencies('../src/Sponde.js');
data = Compiler.compile(data);
Files.write('Sponde.js', data);



