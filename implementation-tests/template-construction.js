test(function(ret) {
	try {
		var template = Histone();
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'no input');

test(function(ret) {
	try {
		var template = Histone(undefined);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'undefined input');

test(function(ret) {
	try {
		var template = Histone(null);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'null input');

test(function(ret) {
	try {
		var template = Histone(true);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'true input');

test(function(ret) {
	try {
		var template = Histone(false);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'false input');

test(function(ret) {
	try {
		var template = Histone(0);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, '0 input');

test(function(ret) {
	try {
		var template = Histone(10);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, '10 input');

test(function(ret) {
	try {
		var template = Histone({"foo": "bar"});
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, '{"foo": "bar"} input');

test(function(ret) {
	try {
		var template = Histone('{{2 * 2', 'MY_BASE_URI');
	} catch (e) {
		return ret(
			e.file === 'MY_BASE_URI' &&
			e.line === 1 &&
			e.expected === '}}' &&
			e.found === 'EOF'
		);
	}
	return ret(false);
}, 'invalid string');

test(function(ret) {
	var template = Histone('{{2 * 2}}');
	ret(typeof template === 'object' &&
		typeof template.render === 'function' &&
		typeof template.getAST === 'function');
}, 'string');