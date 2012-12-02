test(function(ret) {
	ret(typeof Histone === 'function' &&
		typeof Histone.setURIResolver === 'function');
}, 'testing Histone object');