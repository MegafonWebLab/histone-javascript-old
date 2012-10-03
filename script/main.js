$(document).ready(function() {

	var hlLine = 0;
	var examples = [];
	var Histone = null;
	var sideBar = $('.sidebar');
	var consoleEl =  $('.console');
	var resultEl = $('.right-column');
	var resultFormatEl = $('.result-format');
	var textResultEl = $('.text-area', resultEl);
	var htmlResultEl = $('.html-area', resultEl);
	var astResultEl = $('.ast-area', resultEl);
	var preloaderEl = $('.preloader-layer, .preloader-image');

	var templateEditor = CodeMirror.fromTextArea(
		$('.template')[0], {
			theme: 'elegant',
			mode: 'histone',
			indentUnit: 4,
			lineNumbers: true,
			lineWrapping: false,
			indentWithTabs: true,
			matchBrackets: true,
			autofocus: true,
			onCursorActivity: onCursorActivity
		}
	);

	function onCursorActivity() {
		var currentLine = templateEditor.getCursor().line;
		templateEditor.setLineClass(hlLine, null, null);
		hlLine = templateEditor.setLineClass(currentLine, null, 'activeline');
	}

	function hidePreloader() {
		preloaderEl.animate({opacity: 0}, function() {
			$(this).css('opacity', '');
			$('html').removeClass('loading');
		});
	}

	function setError(error) {
		consoleEl.html(error);
	}

	function setResult(result) {
		textResultEl.val(result);
		htmlResultEl.html(result);
	}

	function getResultFormat() {
		return resultFormatEl.val();
	}

	function setResultFormat(format) {
		resultFormatEl.val(format);
		if (format === 'html') {
			resultEl.removeClass('result-text');
			resultEl.removeClass('result-ast');
			resultEl.addClass('result-html');
		} else if (format === 'text') {
			resultEl.removeClass('result-ast');
			resultEl.removeClass('result-html');
			resultEl.addClass('result-text');
		} else {
			resultEl.removeClass('result-html');
			resultEl.removeClass('result-text');
			resultEl.addClass('result-ast');
		}
	}

	function swapResultFormat() {
		var resultFormat = getResultFormat();
		if (resultFormat === 'html') {
			setResultFormat('text');
		} else if (resultFormat === 'text') {
			setResultFormat('ast');
		} else {
			setResultFormat('html');
		}
	}

	function updateResultFormat() {
		var resultFormat = getResultFormat();
		if (resultFormat === 'html') {
			setResultFormat('html');
		} else if (resultFormat === 'text') {
			setResultFormat('text');
		} else {
			setResultFormat('ast');
		}
	}

	function processTemplate() {
		templateEditor.focus();
		var thisObj = window.location;
		var baseURI = window.location.href;
		var template = templateEditor.getValue();
		try {
			template = Histone(template, baseURI);
		} catch (exception) {
			setError(exception.toString());
			return;
		}
		setError('');
		var templateAST = template.getAST();
		templateAST = JSON.stringify(templateAST);
		templateAST = js_beautify(templateAST);
		astResultEl.val(templateAST);
		template.render(function(result) {
			setResult(result);
		}, thisObj);
	}

	function renderExamples(examplesList) {
		$(examplesList).find('examples example').each(function() {
			var example = $(this);
			var exampleName = example.attr('name');
			var exampleData = example.text();

			exampleData = exampleData.replace(/\n\x09{2}/g, '\n');
			exampleData = exampleData.replace(/^\s\s*/, '');
			exampleData = exampleData.replace(/\s\s*$/, '');

			examples.push(exampleData);
			var sideBarItem = $('<div></div>');
			sideBarItem.addClass('sidebar-item');
			sideBarItem.data('index', examples.length - 1);
			sideBarItem.data('name', exampleName);
			sideBarItem.html(exampleName);
			sideBarItem.appendTo(sideBar);

		});
	}

	function sideBarItemClick() {
		var sideBarItem = $(this);
		var sideBarItemSelected = $('.sidebar-item-selected', sideBar);
		if (sideBarItemSelected.is(sideBarItem)) return;
		sideBarItem.addClass('sidebar-item-selected');
		sideBarItemSelected.removeClass('sidebar-item-selected');
		var exampleName = sideBarItem.data('name');
		var exampleIndex = sideBarItem.data('index');
		var exampleData = examples[exampleIndex];
		templateEditor.setValue(exampleData);
		templateEditor.focus();
	}

	require([
		'https://raw.github.com/MegafonWebLab/' +
		'histone-javascript/master/src/Histone.js'
	], function(HistoneRef) {

		$.get('examples/examples.xml', function(result) {
			renderExamples(result);
			Histone = HistoneRef;
			$('.toolbar-button').on('click', processTemplate);
			$('.change-result-format').on('click', swapResultFormat);
			$('.sidebar-item').on('click', sideBarItemClick);
			resultFormatEl.on('change', updateResultFormat);
			hlLine = templateEditor.setLineClass(0, 'activeline');
			$('.sidebar-item').first().trigger('click');
			hidePreloader();
		});

	});

});
