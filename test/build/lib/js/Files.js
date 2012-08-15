with (exports) {

	/**
	 * Provides a separate namespace for most often used Java classes.
	 * @type {Object}
	 */
	const Java = JavaImporter(
		java.io.File,
		java.net.URI,
		java.io.FileWriter,
		java.io.PrintWriter,
		java.io.FileInputStream,
		java.io.FileOutputStream
	);

	/**
	 * Checks if the directory or file exists.
	 * @param {string} path Directory or file path to check.
	 * @return {boolean} Returns true if the path exists.
	 */
	exports.exists = function(path) {
		var fileRef = new Java.File(path);
		return fileRef.exists();
	};

	/**
	 * Checks if the path is directory.
	 * @param {string} path Directory path to check.
	 * @return {boolean} Returns true if the path is directory.
	 */
	exports.isDir = function(path) {
		var fileRef = new Java.File(path);
		return (fileRef.isDirectory());
	};

	/**
	 * Checks if the path is file.
	 * @param {string} path File path to check.
	 * @return {boolean} Returns true if the path is file.
	 */
	exports.isFile = function(path) {
		var fileRef = new Java.File(path);
		return (fileRef.isFile());
	};

	/**
	 * Extracts file name from the path.
	 * @param {string} path Full path.
	 * @return {string} File name.
	 */
	exports.getName = function(path) {
		var fileRef = new Java.File(path);
		return String(fileRef.getName());
	};

	/**
	 * Extracts absolute path from the relative one.
	 * @param {string} path Relative path.
	 * @return {string} Absolute path.
	 */
	exports.getAbsolutePath = function(path) {
		var fileRef = new Java.File(path);
		fileRef = fileRef.getCanonicalPath();
		fileRef = new Java.File(fileRef);
		fileRef = fileRef.getAbsolutePath();
		return String(fileRef);
	};

	/**
	 * Returns the time that the file was last modified.
	 * @param {string} path Full path.
	 * @return {number} File's last modification time.
	 */
	exports.getLastModified = function(path) {
		var fileRef = new Java.File(path);
		return parseInt(fileRef.lastModified());
	};

	/**
	 * Resolves basePath against relPath.
	 * @param {string} relPath Relative path.
	 * @param {string} basePath Base path.
	 * @return {string} Resolved path.
	 */
	exports.resolvePath = function(relPath, basePath) {
		var basePath = basePath.replace(/\\/g, '/');
		var relPath = relPath.replace(/\\/g, '/');
		basePath = new Java.URI(basePath);
		relPath = new Java.URI(relPath);
		return String(basePath.resolve(relPath));
	};

	/**
	 * Creates new directory.
	 * @param {string} path Directory path.
	 * @return {boolean} Returns true in case of success.
	 */
	exports.mkDir = function(path) {
		var fileRef = new Java.File(path);
		if (fileRef.exists()) {
			return (fileRef.isDirectory());
		}
		var parents = [path];
		var parentDir = fileRef;
		while (parentDir = parentDir.getParentFile()) {
			parents.unshift(String(parentDir));
		}
		while (parents.length) {
			fileRef = new Java.File(parents.shift());
			if (!fileRef.exists() && !fileRef.mkdir()) {
				return false;
			}
		}
		return true;
	};

	/**
	 * Reads data from the file.
	 * @param {string} fileName File name to use.
	 * @return {String} Readed data.
	 */
	exports.read = function(fileName) {
		return String(readFile(fileName));
	};

	/**
	 * Removes the file.
	 * @param {string} path Full path.
	 */
	exports.remove = function(path) {
		var fileRef = new Java.File(path);
		if (!fileRef.exists()) return;
		if (!fileRef.canWrite()) return;
		if (fileRef.isDirectory()) {
			readDir(path, function(file) {
				remove(file.path);
			});
		}
		fileRef.delete();
	};

	/**
	 * Writes data into the file.
	 * @param {string} fileName File name to use.
	 * @param {string} data Data to write.
	 * @return {boolean} Returns true in case of success.
	 */
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
	
	exports.readDir = function(path, callback) {
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

/*	exports.copyDir = function(from, to, exceptions) {
		if (!utils.isArray(exceptions)) {
			exceptions = [];
		}

		var fromFileRef = new Java.File(from);
		var toFileRef = new Java.File(to);

		if (exceptions.indexOf(String(fromFileRef.getName())) === -1) {
			if (fromFileRef.isDirectory()) {
				if (!toFileRef.exists()) {
					toFileRef.mkdir();
				}
				var children = fromFileRef.list();
				for (var c = 0; c < children.length; c++) {
					exports.copyDir(
						new Java.File(fromFileRef, children[c]),
						new Java.File(toFileRef, children[c]),
						exceptions
					);
				}
			} else if (fromFileRef.isFile()) {
				// this is copy file
				var inputStream = new Java.FileInputStream(from);
				var outputStream = new Java.FileOutputStream(to);
				var buffer = java.lang.reflect.Array.newInstance(
					java.lang.Byte.TYPE, 1024
				);
				var length = 0;
				while ((length = inputStream.read(buffer)) > 0) {
					outputStream.write(buffer, 0, length);
				}
				inputStream.close();
				outputStream.close();
			}
		}
	};
*/
}