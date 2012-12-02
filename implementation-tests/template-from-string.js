test(function(ret) {
	var template = Histone('{{2 * 2}}');
	var templateAST = template.getAST();
	templateAST = JSON.stringify(templateAST[1]);
	ret(templateAST === JSON.stringify([
			[11, [101, 2], [101, 2]]
		]
	));
}, 'getAST');

test(function(ret) {
	Histone('{{2 * 2}}').render(function(result) {
		ret(typeof result === 'string' && result === '4');
	});
}, 'render');

test(function(ret) {
	Histone('{{baseURI}}').render(function(result) {
		ret(result === '.');
	});
}, 'render + default baseURI');

test(function(ret) {
	Histone('{{baseURI}}', 'custom base uri').render(function(result) {
		ret(result === 'custom base uri');
	});
}, 'render + custom baseURI');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === 'null');
	}, undefined);
}, 'render + passing context (undefined)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === 'null');
	}, null);
}, 'render + passing context (null)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === 'true');
	}, true);
}, 'render + passing context (true)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === 'false');
	}, false);
}, 'render + passing context (false)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === '"string"');
	}, 'string');
}, 'render + passing context (string)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === '10');
	}, 10);
}, 'render + passing context (number)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === '[1,2,3]');
	}, [1, 2, 3]);
}, 'render + passing context (array)');

test(function(ret) {
	Histone('{{this.toJSON()}}').render(function(result) {
		ret(result === '{\"foo\":\"bar\"}');
	}, {"foo": "bar"});
}, 'render + passing context (object)');

test(function(ret) {
	Histone('{{this.isUndefined()}}').render(function(result) {
		ret(result === 'true');
	}, function() { alert(123); });
}, 'render + passing context (function)');

test(function(ret) {
	Histone('{{var x = 10}}{{macro foo}}{{self.arguments.toJSON()}}{{/macro}}').render(
		function(result, stack) {
			Histone('{{x}}{{foo(1, 2, 3)}}').render(function(result) {
				ret(result === '10[1,2,3]');
			}, stack);
		}
	);
}, 'render + passing context (previously generated stack)');

test(function(ret) {
	Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{/macro}}').render(
		'foo',
		function(result) {
			ret(result === 'args:[]');
		}
	);
}, 'render + calling macro');

test(function(ret) {
	Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{/macro}}').render(
		'foo',
		[1, 2, function() { alert(123); }],
		function(result) {
			ret(result === 'args:[1,2,null]');
		}
	);
}, 'render + calling macro with arguments');

test(function(ret) {
	Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{this.toJSON()}}{{/macro}}').render(
		'foo',
		function(result) {
			ret(result === 'args:[]{\"foo\":\"bar\"}');
		},
		{"foo": "bar"}
	);
}, 'render + calling macro + passing context');

test(function(ret) {
	Histone('{{macro foo}}args:{{self.arguments.toJSON()}}{{this.toJSON()}}{{/macro}}').render(
		'foo',
		[1, 2, 3],
		function(result) {
			ret(result === 'args:[1,2,3]{\"foo\":\"bar\"}');
		},
		{"foo": "bar"}
	);
}, 'render + calling macro with arguments + passing context');