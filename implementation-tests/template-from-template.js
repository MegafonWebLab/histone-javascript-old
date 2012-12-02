test(function(ret) {
	var template1 = Histone('{{2 * 2}}');
	var template1AST = template1.getAST();
	template1AST = JSON.stringify(template1AST);
	var template2 = Histone(template1);
	var template2AST = template2.getAST();
	template2AST = JSON.stringify(template2AST);
	ret(template1AST === template2AST);
}, 'getAST');

test(function(ret) {
	var template = Histone('{{2 * 2}}');
	Histone(template).render(function(result) {
		ret(typeof result === 'string' && result === '4');
	});
}, 'render');

test(function(ret) {
	var template = Histone('{{baseURI}}');
	Histone(template).render(function(result) {
		ret(result === '.');
	});
}, 'render + default baseURI');

test(function(ret) {
	var template = Histone('{{baseURI}}', 'custom base uri');
	Histone(template).render(function(result) {
		ret(result === 'custom base uri');
	});
}, 'render + custom baseURI');

test(function(ret) {
	var template = Histone('{{baseURI}}');
	Histone(template, 'override baseURI').render(function(result) {
		ret(result === 'override baseURI');
	});
}, 'render + override default baseURI');

test(function(ret) {
	var template = Histone('{{baseURI}}', 'custom base uri');
	Histone(template, 'override baseURI').render(function(result) {
		ret(result === 'override baseURI');
	});
}, 'render + override custom baseURI');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === 'null');
	}, undefined);
}, 'render + passing context (undefined)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === 'null');
	}, null);
}, 'render + passing context (null)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === 'true');
	}, true);
}, 'render + passing context (true)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === 'false');
	}, false);
}, 'render + passing context (false)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === '"string"');
	}, 'string');
}, 'render + passing context (string)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === '10');
	}, 10);
}, 'render + passing context (number)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === '[1,2,3]');
	}, [1, 2, 3]);
}, 'render + passing context (array)');

test(function(ret) {
	var template = Histone('{{this.toJSON()}}');
	Histone(template).render(function(result) {
		ret(result === '{\"foo\":\"bar\"}');
	}, {"foo": "bar"});
}, 'render + passing context (object)');

test(function(ret) {
	var template = Histone('{{this.isUndefined()}}');
	Histone(template).render(function(result) {
		ret(result === 'true');
	}, function() { alert(123); });
}, 'render + passing context (function)');

test(function(ret) {
	var template = Histone('{{var x = 10}}{{macro foo}}{{self.arguments.toJSON()}}{{/macro}}');
	Histone(template).render(
		function(result, stack) {
			Histone('{{x}}{{foo(1, 2, 3)}}').render(function(result) {
				ret(result === '10[1,2,3]');
			}, stack);
		}
	);
}, 'render + passing context (previously generated stack)');

test(function(ret) {
	var template = Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{/macro}}');
	Histone(template).render(
		'foo',
		function(result) {
			ret(result === 'args:[]');
		}
	);
}, 'render + calling macro');

test(function(ret) {
	var template = Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{/macro}}');
	Histone(template).render(
		'foo',
		[1, 2, function() { alert(123); }],
		function(result) {
			ret(result === 'args:[1,2,null]');
		}
	);
}, 'render + calling macro with arguments');

test(function(ret) {
	var template = Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{this.toJSON()}}{{/macro}}');
	Histone(template).render(
		'foo',
		function(result) {
			ret(result === 'args:[]{\"foo\":\"bar\"}');
		},
		{"foo": "bar"}
	);
}, 'render + calling macro + passing context');

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
}, 'render + calling macro with arguments + passing context');