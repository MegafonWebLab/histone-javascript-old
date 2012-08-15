var Files = require('Files');
var Utils = require('Utils');

const REPO_USER = Utils.getEnv('repo-user');
const REPO_PASS = Utils.getEnv('repo-pass');
const REPO_PATH = Utils.getEnv('repo-path');
const TARGET_PATH = Utils.getEnv('target-path');

function loadJSON(fileName) {
	var result = readFile(fileName);
	return JSON.parse(result);
}

var Java = JavaImporter(
	java.io.File,
	org.tmatesoft.svn.core.SVNURL,
	org.tmatesoft.svn.core.wc.SVNClientManager,
	org.tmatesoft.svn.core.wc.SVNRevision
);

var clientManager = Java.SVNClientManager.newInstance(null, REPO_USER, REPO_PASS);
var updateClient = clientManager.getUpdateClient();
var WCClient = clientManager.getWCClient();

function SVNGetEntryKind(svnUrl) {
	return String(WCClient.doInfo(
		Java.SVNURL.parseURIEncoded(svnUrl),
		Java.SVNRevision.HEAD,
		Java.SVNRevision.HEAD
	).getKind());
}

function SVNExport(svnUrl, target) {
	updateClient.doExport(
		Java.SVNURL.parseURIEncoded(svnUrl),
		new Java.File(target),
		Java.SVNRevision.HEAD,
		Java.SVNRevision.HEAD,
		null, true, true
	);
}

var tempName = Utils.uniqueId();
SVNExport(REPO_PATH, './' + tempName);
var repository = loadJSON(tempName);
Files.remove(tempName);
var availablePackages = repository.packages;

function getDependencies(dependencies, result) {
	var result = (result ? result : {});
	for (var i = 0; i < dependencies.length; i++) {
		var dependency = dependencies[i];
		if (result[dependency]) continue;
		var dependencyInfo = availablePackages[dependency];
		if (dependencyInfo) {
			result[dependency] = {
				main: dependencyInfo.main,
				path: dependencyInfo.path,
				packages: dependencyInfo.packages
			};
			if (dependencyInfo.deps) getDependencies(
				dependencyInfo.deps, result
			);
		} else result[dependency] = {};
	}
	return result;
}

function buildDependencies(dependencies, targetPath) {
	var result = [];
	for (var dependencyName in dependencies) {

		var dependencyTarget = '';
		var dependencyInfo = dependencies[dependencyName];
		var dependencyMain = (dependencyInfo.main || 'main');
		var dependencyLocation = targetPath;
		var dependencyPackages = (dependencyInfo.packages || {});

		var dependencyKind = SVNGetEntryKind(dependencyInfo.path);
		if (dependencyKind === 'file') {
			dependencyMain = (dependencyName + '.js');
			dependencyTarget = targetPath + dependencyMain;
		} else {
			dependencyLocation = (targetPath + dependencyName);
			dependencyTarget = dependencyLocation;
		}

		print('building:', dependencyName, 'to', dependencyTarget);
		SVNExport(dependencyInfo.path, dependencyTarget);

		result.push({
			name: dependencyName,
			location: dependencyLocation,
			main: dependencyMain
		});

		for (var packageName in dependencyPackages) {
			var packageInfo = dependencyPackages[packageName];
			result.push({
				name: dependencyName + '.' + packageName,
				location: dependencyLocation + '/' + packageInfo.path,
				main: (packageInfo.main || 'main')
			});
		}
	}
	return result;
}

Files.remove(TARGET_PATH);
Files.mkDir(TARGET_PATH);

var packageInfo = loadJSON('package.json');
var packageDeps = getDependencies(packageInfo.deps);
var packageDeps = buildDependencies(packageDeps, TARGET_PATH + '/packages/');

var bootContents = '';
for (var c = 0; c < repository.boot.length; c++) {
	var tFile = Utils.uniqueId();
	SVNExport(repository.boot[c], './' + tFile);
	bootContents += Files.read(tFile);
	Files.remove(tFile);
}

bootContents += 'require.config({packages:';
bootContents += JSON.stringify(packageDeps);
bootContents += '});';
Files.write('script/require.js', bootContents);