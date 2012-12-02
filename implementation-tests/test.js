test(function(ret) {
	ret(typeof Histone === 'function' &&
		typeof Histone.setURIResolver === 'function');
}, 'testing Histone object');

test(function(ret) {
	try {
		var template = Histone();
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'constructing template from no input -> testing for exception');

test(function(ret) {
	try {
		var template = Histone(undefined);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'constructing template from undefined input -> testing for exception');

test(function(ret) {
	try {
		var template = Histone(null);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'constructing template from null input -> testing for exception');

test(function(ret) {
	try {
		var template = Histone(true);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'constructing template from true input -> testing for exception');

test(function(ret) {
	try {
		var template = Histone(false);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'constructing template from false input -> testing for exception');

test(function(ret) {
	try {
		var template = Histone(0);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'constructing template from 0 input -> testing for exception');

test(function(ret) {
	try {
		var template = Histone(10);
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'constructing template from 10 input -> testing for exception');

test(function(ret) {
	try {
		var template = Histone({"foo": "bar"});
	} catch (e) {
		return ret(true);
	}
	return ret(false);
}, 'constructing template from {"foo": "bar"} input -> testing for exception');

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
}, 'constructing template from string parse error -> test for exception');

test(function(ret) {
	var template = Histone('{{2 * 2}}');
	ret(typeof template === 'object' &&
		typeof template.render === 'function' &&
		typeof template.getAST === 'function');
}, 'constructing template from string -> testing template object');

test(function(ret) {
	var template = Histone('{{2 * 2}}');
	var templateAST = template.getAST();
	templateAST = JSON.stringify(templateAST[1]);
	ret(templateAST === JSON.stringify([
			[11, [101, 2], [101, 2]]
		]
	));
}, 'constructing template from string -> getAST');

test(function(ret) {
	Histone('{{2 * 2}}').render(function(result) {
		ret(typeof result === 'string' && result === '4');
	});
}, 'constructing template from string -> render');

test(function(ret) {
	Histone('{{baseURI}}').render(function(result) {
		ret(result === '.');
	});
}, 'constructing template from string -> render + default baseURI');

test(function(ret) {
	Histone('{{baseURI}}', 'custom base uri').render(function(result) {
		ret(result === 'custom base uri');
	});
}, 'constructing template from string -> render + custom baseURI');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === 'null');
	}, undefined);
}, 'constructing template from string -> render + passing context (undefined)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === 'null');
	}, null);
}, 'constructing template from string -> render + passing context (null)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === 'true');
	}, true);
}, 'constructing template from string -> render + passing context (true)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === 'false');
	}, false);
}, 'constructing template from string -> render + passing context (false)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === '"string"');
	}, 'string');
}, 'constructing template from string -> render + passing context (string)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === '10');
	}, 10);
}, 'constructing template from string -> render + passing context (number)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === '[1,2,3]');
	}, [1, 2, 3]);
}, 'constructing template from string -> render + passing context (array)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === '{\"foo\":\"bar\"}');
	}, {"foo": "bar"});
}, 'constructing template from string -> render + passing context (object)');

test(function(ret) {
	Histone('{{this.isUndefined()}}').render(function(result) {
		ret(result === 'true');
	}, function() { alert(123); });
}, 'constructing template from string -> render + passing context (function)');

test(function(ret) {
	Histone('{{var x = 10}}{{macro foo}}{{self.arguments.toJSON()}}{{/macro}}').render(
		function(result, stack) {
			Histone('{{x}}{{foo(1, 2, 3)}}').render(function(result) {
				ret(result === '10[1,2,3]');
			}, stack);
		}
	);
}, 'constructing template from string -> render + passing context (previously generated stack)');

test(function(ret) {
	Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{/macro}}').render(
		'foo',
		function(result) {
			ret(result === 'args:[]');
		}
	);
}, 'constructing template from string -> render + calling macro');

test(function(ret) {
	Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{/macro}}').render(
		'foo',
		[1, 2, function() { alert(123); }],
		function(result) {
			ret(result === 'args:[1,2,null]');
		}
	);
}, 'constructing template from string -> render + calling macro with arguments');

test(function(ret) {
	Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{this.toJSON()}}{{/macro}}').render(
		'foo',
		function(result) {
			ret(result === 'args:[]{\"foo\":\"bar\"}');
		},
		{"foo": "bar"}
	);
}, 'constructing template from string -> render + calling macro + passing context');

test(function(ret) {
	Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{this.toJSON()}}{{/macro}}').render(
		'foo',
		[1, 2, 3],
		function(result) {
			ret(result === 'args:[1,2,3]{\"foo\":\"bar\"}');
		},
		{"foo": "bar"}
	);
}, 'constructing template from string -> render + calling macro with arguments + passing context');

test(function(ret) {
	var template = Histone('{{2 * 2}}');
	Histone(template.getAST()).render(function(result) {
		ret(typeof result === 'string' && result === '4');
	});
}, 'constructing template from previously generated AST -> render');

test(function(ret) {
	var template = Histone('{{baseURI}}');
	Histone(template.getAST()).render(function(result) {
		ret(result === '.');
	});
}, 'constructing template from previously generated AST -> render + default baseURI');

test(function(ret) {
	var template = Histone('{{baseURI}}', 'custom base uri');
	Histone(template.getAST()).render(function(result) {
		ret(result === 'custom base uri');
	});
}, 'constructing template from previously generated AST -> render + custom baseURI');

test(function(ret) {
	var template = Histone('{{baseURI}}');
	Histone(template.getAST(), 'override baseURI').render(function(result) {
		ret(result === 'override baseURI');
	});
}, 'constructing template from previously generated AST -> render + override default baseURI');

test(function(ret) {
	var template = Histone('{{baseURI}}', 'custom base uri');
	Histone(template.getAST(), 'override baseURI').render(function(result) {
		ret(result === 'override baseURI');
	});
}, 'constructing template from previously generated AST -> render + override custom baseURI');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template.getAST()).render(function(result) {
		ret(result === 'null');
	}, undefined);
}, 'constructing template from previously generated AST -> render + passing context (undefined)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template.getAST()).render(function(result) {
		ret(result === 'null');
	}, null);
}, 'constructing template from previously generated AST -> render + passing context (null)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template.getAST()).render(function(result) {
		ret(result === 'true');
	}, true);
}, 'constructing template from previously generated AST -> render + passing context (true)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template.getAST()).render(function(result) {
		ret(result === 'false');
	}, false);
}, 'constructing template from previously generated AST -> render + passing context (false)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template.getAST()).render(function(result) {
		ret(result === '"string"');
	}, 'string');
}, 'constructing template from previously generated AST -> render + passing context (string)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template.getAST()).render(function(result) {
		ret(result === '10');
	}, 10);
}, 'constructing template from previously generated AST -> render + passing context (number)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template.getAST()).render(function(result) {
		ret(result === '[1,2,3]');
	}, [1, 2, 3]);
}, 'constructing template from previously generated AST -> render + passing context (array)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template.getAST()).render(function(result) {
		ret(result === '{\"foo\":\"bar\"}');
	}, {"foo": "bar"});
}, 'constructing template from previously generated AST -> render + passing context (object)');

test(function(ret) {
	var template = Histone('{{this.isUndefined()}}');
	Histone(template.getAST()).render(function(result) {
		ret(result === 'true');
	}, function() { alert(123); });
}, 'constructing template from previously generated AST -> render + passing context (function)');

test(function(ret) {
	var template = Histone('{{var x = 10}}{{macro foo}}{{self.arguments.toJSON()}}{{/macro}}');
	Histone(template.getAST()).render(
		function(result, stack) {
			Histone('{{x}}{{foo(1, 2, 3)}}').render(function(result) {
				ret(result === '10[1,2,3]');
			}, stack);
		}
	);
}, 'constructing template from previously generated AST -> render + passing context (previously generated stack)');

test(function(ret) {
	var template = Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{/macro}}');
	Histone(template.getAST()).render(
		'foo',
		function(result) {
			ret(result === 'args:[]');
		}
	);
}, 'constructing template from previously generated AST -> render + calling macro');

test(function(ret) {
	var template = Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{/macro}}');
	Histone(template.getAST()).render(
		'foo',
		[1, 2, function() { alert(123); }],
		function(result) {
			ret(result === 'args:[1,2,null]');
		}
	);
}, 'constructing template from previously generated AST -> render + calling macro with arguments');

test(function(ret) {
	var template = Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{this.toJSON()}}{{/macro}}');
	Histone(template.getAST()).render(
		'foo',
		function(result) {
			ret(result === 'args:[]{\"foo\":\"bar\"}');
		},
		{"foo": "bar"}
	);
}, 'constructing template from previously generated AST -> render + calling macro + passing context');

test(function(ret) {
	var template = Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{this.toJSON()}}{{/macro}}');
	Histone(template.getAST()).render(
		'foo',
		[1, 2, 3],
		function(result) {
			ret(result === 'args:[1,2,3]{\"foo\":\"bar\"}');
		},
		{"foo": "bar"}
	);
}, 'constructing template from previously generated AST -> render + calling macro with arguments + passing context');

test(function(ret) {
	var template = Histone('{{2 * 2}}');
	Histone(template).render(function(result) {
		ret(typeof result === 'string' && result === '4');
	});
}, 'constructing template from previously generated template -> render');

test(function(ret) {
	var template = Histone('{{baseURI}}');
	Histone(template).render(function(result) {
		ret(result === '.');
	});
}, 'constructing template from previously generated template -> render + default baseURI');

test(function(ret) {
	var template = Histone('{{baseURI}}', 'custom base uri');
	Histone(template).render(function(result) {
		ret(result === 'custom base uri');
	});
}, 'constructing template from previously generated template -> render + custom baseURI');

test(function(ret) {
	var template = Histone('{{baseURI}}');
	Histone(template, 'override baseURI').render(function(result) {
		ret(result === 'override baseURI');
	});
}, 'constructing template from previously generated template -> render + override default baseURI');

test(function(ret) {
	var template = Histone('{{baseURI}}', 'custom base uri');
	Histone(template, 'override baseURI').render(function(result) {
		ret(result === 'override baseURI');
	});
}, 'constructing template from previously generated template -> render + override custom baseURI');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === 'null');
	}, undefined);
}, 'constructing template from previously generated template -> render + passing context (undefined)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === 'null');
	}, null);
}, 'constructing template from previously generated template -> render + passing context (null)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === 'true');
	}, true);
}, 'constructing template from previously generated template -> render + passing context (true)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === 'false');
	}, false);
}, 'constructing template from previously generated template -> render + passing context (false)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === '"string"');
	}, 'string');
}, 'constructing template from previously generated template -> render + passing context (string)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === '10');
	}, 10);
}, 'constructing template from previously generated template -> render + passing context (number)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === '[1,2,3]');
	}, [1, 2, 3]);
}, 'constructing template from previously generated template -> render + passing context (array)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === '{\"foo\":\"bar\"}');
	}, {"foo": "bar"});
}, 'constructing template from previously generated template -> render + passing context (object)');

test(function(ret) {
	var template = Histone('{{this.isUndefined()}}');
	Histone(template).render(function(result) {
		ret(result === 'true');
	}, function() { alert(123); });
}, 'constructing template from previously generated template -> render + passing context (function)');

test(function(ret) {
	var template = Histone('{{var x = 10}}{{macro foo}}{{self.arguments.toJSON()}}{{/macro}}');
	Histone(template).render(
		function(result, stack) {
			Histone('{{x}}{{foo(1, 2, 3)}}').render(function(result) {
				ret(result === '10[1,2,3]');
			}, stack);
		}
	);
}, 'constructing template from previously generated template -> render + passing context (previously generated stack)');

test(function(ret) {
	var template = Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{/macro}}');
	Histone(template).render(
		'foo',
		function(result) {
			ret(result === 'args:[]');
		}
	);
}, 'constructing template from previously generated template -> render + calling macro');

test(function(ret) {
	var template = Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{/macro}}');
	Histone(template).render(
		'foo',
		[1, 2, function() { alert(123); }],
		function(result) {
			ret(result === 'args:[1,2,null]');
		}
	);
}, 'constructing template from previously generated template -> render + calling macro with arguments');

test(function(ret) {
	var template = Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{this.toJSON()}}{{/macro}}');
	Histone(template).render(
		'foo',
		function(result) {
			ret(result === 'args:[]{\"foo\":\"bar\"}');
		},
		{"foo": "bar"}
	);
}, 'constructing template from previously generated template -> render + calling macro + passing context');

test(function(ret) {
	var template = Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{this.toJSON()}}{{/macro}}');
	Histone(template).render(
		'foo',
		[1, 2, 3],
		function(result) {
			ret(result === 'args:[1,2,3]{\"foo\":\"bar\"}');
		},
		{"foo": "bar"}
	);
}, 'constructing template from previously generated template -> render + calling macro with arguments + passing context');