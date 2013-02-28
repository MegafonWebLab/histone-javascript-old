var Path = require('path');
var FileSystem = require('fs');
var UglifyJS = require('uglify-js');
var TestRunner = require('./test-runner.js');

var Krang = require('../../krang-js.git/krang.js');

var BUILD_TPL = Path.resolve(__dirname, 'build.tpl');
var SOURCE_FILE = Path.resolve(__dirname, '../src/Histone.js');
var TARGET_FILE = Path.resolve(__dirname, '../Histone.js');
var TEST_PATH = Path.resolve(__dirname, '../histone-acceptance-tests/src/main/acceptance/');

function message() {
	var args = Array.prototype.slice.call(arguments);
	if (!args.length) console.info();
	else console.info('>', args.join(' '));
}

function doBuild(callback) {
	Krang({
		debug: true
	}).require([SOURCE_FILE, BUILD_TPL].join('!'), function(buildTpl) {
		Krang.build(SOURCE_FILE, function(Histone) {
			buildTpl.render(function(Histone) {
				FileSystem.writeFile(TARGET_FILE, Histone, function() {
					if (typeof callback === 'function') callback();
				});
			}, {alias: 'Histone', module: Histone});
		});
	});
}

function doOptimize(callback) {
	message();
	message('optimizing', TARGET_FILE);
	var data = UglifyJS.minify(TARGET_FILE).code;
	FileSystem.writeFile(TARGET_FILE, data, function() {
		message('done optimizing', TARGET_FILE);
		if (typeof callback === 'function') callback();
	});
}

function doTest(callback) {
	message();
	message('testing', TARGET_FILE);
	var Histone = require(TARGET_FILE);
	TestRunner(Histone, TEST_PATH, function(result) {
		message();
		message('EXECUTED:', result.executed, 'test cases');
		message('SUCCEEDED:', result.succeeded, 'test cases');
		message('FAILED:', result.failed, 'test cases');
		message('IGNORED:', result.ignored, 'test cases');
		message();
		if (typeof callback === 'function')
			callback(result.failed !== 0);
	});
}

doBuild(function() {
	doOptimize(function() {
		doTest(process.exit);
	});
});

