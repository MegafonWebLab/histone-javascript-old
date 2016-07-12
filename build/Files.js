var Utils = require('./Utils.js');
var System = require('./System.js');

var ENV_TYPE = System.getEnvType();

var Java = (ENV_TYPE === 'rhino' && JavaImporter(
	java.io.File, java.net.URI,
	java.io.FileWriter, java.io.PrintWriter,
	java.io.FileInputStream, java.io.FileOutputStream
));

var FS = (ENV_TYPE === 'node' && require('fs'));

var FILE_SEPARATOR = '/';//Utils.getProp('file.separator');

with (exports) {

	exports.exists = function(path) {
		if (!Utils.isString(path)) return false;
		if (ENV_TYPE === 'rhino') {
			var fileRef = new Java.File(path);
			return fileRef.exists();
		} else if (ENV_TYPE === 'node') {
			return FS.existsSync(path);
		}
	};

	exports.isDir = function(path) {
		if (!Utils.isString(path)) return false;
		if (ENV_TYPE === 'rhino') {
			var fileRef = new java.io.File(path);
			return (fileRef.isDirectory());
		} else if (ENV_TYPE === 'node') {
			return FS.lstatSync(path).isDirectory();
		}
	};

	exports.isFile = function(path) {
		if (!Utils.isString(path)) return false;
		if (ENV_TYPE === 'rhino') {
			var fileRef = new java.io.File(path);
			return (fileRef.isFile());
		} else if (ENV_TYPE === 'node') {
			return FS.lstatSync(path).isFile();
		}
	};

	exports.listFiles = function(path) {
		if (!Utils.isString(path)) return [];
		if (ENV_TYPE === 'rhino') {
			var dirObj = new java.io.File(path);
			if (!dirObj.isDirectory()) return [];
			var tList = [], sList = dirObj.list();
			for (var c = 0; c < sList.length; c++) {
				tList.push(String(sList[c]));
			}
			return tList;
		} else if (ENV_TYPE === 'node') {
			if (!isDir(path)) return [];
			return FS.readdirSync(path);
		}
	};

	exports.getName = function(path) {
		if (!Utils.isString(path)) return '';
		var fileRef = new Java.File(path);
		return String(fileRef.getName());
	};

	exports.getLastModified = function(path) {
		var fileRef = new Java.File(path);
		if (!fileRef.exists()) return 0;
		return parseInt(fileRef.lastModified());
	};

	exports.mkDir = function(path) {
		var fileRef = new Java.File(path);
		if (fileRef.exists()) return fileRef.isDirectory();
		return (fileRef.mkdirs());
	};

	exports.resolvePath = function(path, base) {
		if (!Utils.isString(path)) return '';
		if (!Utils.isString(base)) return '';
		return String(new Java.File(base, path));
	};

	exports.getParent = function(path) {
		if (!Utils.isString(path)) return '';
		return String(new Java.File(path).getParentFile());
	};

	exports.remove = function(path) {
		if (!Utils.isString(path)) return true;
		var fileRef = new Java.File(path);
		if (!fileRef.exists()) return true;
		if (!fileRef.canWrite()) return false;
		if (fileRef.isDirectory()) {
			readDir(path, function(file) {
				remove(file.path);
			});
		}
		return fileRef.delete();
	};

	exports.move = function(fromPath, toPath, force) {
		var fromPath = new Java.File(fromPath);
		if (!fromPath.exists()) return false;
		var toPath = new Java.File(toPath);
		if (!force && toPath.exists()) return false;
		return fromPath.renameTo(toPath);
	};

	exports.copy = function(fromFile, toFile) {
		var fromFileObj = new Java.File(fromFile);
		if (!fromFileObj.exists()) return false;
		var toFileObj = new Java.File(toFile);
		if (!toFileObj.exists()) {
			var parentObj = toFileObj.getParentFile();
			if (parentObj = String(parentObj)) {
				if (!mkDir(parentObj)) return false;
			}
			if (fromFileObj.isDirectory()) {
				toFileObj.mkdir();
			} else if (fromFileObj.isFile()) {
				toFileObj.createNewFile();
			}
		}
		if (fromFileObj.isFile() && toFileObj.isFile()) {
			var inChannel = new Java.FileInputStream(fromFileObj).getChannel();
			var outChannel = new Java.FileOutputStream(toFileObj).getChannel();
			outChannel.transferFrom(inChannel, 0, inChannel.size());
		} else if (fromFileObj.isDirectory() && toFileObj.isDirectory()) {
			readDir(fromFile, function(resource) {
				var path = resolvePath(resource.name, toFile);
				copy(resource.path, path);
				return false;
			});
		}
	};

	exports.read = function(fileName) {
		if (ENV_TYPE === 'rhino') {
			return String(readFile(fileName));
		} else if (ENV_TYPE === 'node') {
			return String(FS.readFileSync(fileName));
		}
	};

	exports.write = function(fileName, data) {
		var fileRef = new Java.File(fileName);
		if (!fileRef.exists()) {
			var parentObj = fileRef.getParentFile();
			if (parentObj) {
				parentObj = String(parentObj);
				if (!mkDir(parentObj)) {
					return false;
				}
			}
		}
		var fileWriter = new Java.FileWriter(fileName);
		var buffer = new Java.PrintWriter(fileWriter);
		buffer.print(String(data));
		buffer.close();
		return true;
	};

	exports.createTempDir = function(prefix, suffix) {
		if (!Utils.isString(prefix) || prefix.length < 3) prefix = 'tmp';
		if (!Utils.isString(suffix)) suffix = null;
		var tempDir = Java.File.createTempFile(prefix, suffix);
		if (tempDir.delete() && tempDir.mkdir()) {
			return String(tempDir.getAbsolutePath() + FILE_SEPARATOR);
		}
	};

	exports.readDir = function(path/*, wildcard, callback*/) {

		var wildcard, callback;
		if (!Utils.isString(path)) return [];
		var arguments = Array.prototype.slice.call(arguments, 1);

		if (!Utils.isFunction(arguments[0])) {
			wildcard = arguments.shift();
			if (Utils.isString(wildcard)) {
				wildcard = wildcard.replace(/^\/+/, '');
				wildcard = wildcard.replace(/\/+$/, '');
				wildcard = wildcard.replace(/\/+/g, '/');
				wildcard = wildcard.split('/');
			} else wildcard = null;
		}

		if (Utils.isFunction(arguments[0])) {
			callback = arguments.shift();
		} else callback = new Function();

		function compare(from, to) {
			var from = from.split(FILE_SEPARATOR);
			if (from.length !== to.length) return false;
			return (!to.some(function(fragment, index) {
				if (fragment === '*') return false;
				return (fragment !== from[index]);
			}));
		}

		function readDir(path, callback, relPath, wildcard) {
			var result = [];

			if (!isDir(path)) return result;
			var files = listFiles(path);

			for (var fileDescr = {}, c = 0; c < files.length; c++) {

				var fileName = files[c];
				var filePath = path + FILE_SEPARATOR + fileName;

				var relativePath = relPath;
				if (relativePath) relativePath += FILE_SEPARATOR;
				relativePath += fileName;

				if (wildcard) {
					if (!compare(relativePath, wildcard)) {
						if (isDir(filePath)) {
							readDir(
								filePath,
								callback,
								relativePath,
								wildcard
							);
						}
						continue;
					} else relativePath = fileName;
				}

				if (isDir(filePath)) fileDescr = {

					'type': 'folder',
					'name': fileName,
					'path': filePath,
					'relPath': relativePath

				}; else if (isFile(filePath)) fileDescr = {

					'type': 'file',
					'name': fileName,
					'path': filePath,
					'relPath': relativePath

				};

				if (callback(fileDescr) === false) continue;

				if (isDir(filePath)) {
					fileDescr.files = readDir(
						filePath,
						callback,
						relativePath
					);
				}

				result.push(fileDescr);
			}
		}

		return readDir(path, callback, '', wildcard);
	};

}