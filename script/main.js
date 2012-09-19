$(document).ready(function() {

	var hlLine = 0;
	var Histone = null;
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
		astResultEl.html(templateAST);
		template.render(function(result) {
			setResult(result);
		}, thisObj);
	}

	require([
		'https://raw.github.com/MegafonWebLab/' +
		'histone-javascript/master/src/Histone.js'
	], function(HistoneRef) {
		hidePreloader();
		Histone = HistoneRef;
		$('.toolbar-button').on('click', processTemplate);
		$('.change-result-format').on('click', swapResultFormat);
		resultFormatEl.on('change', updateResultFormat);
		hlLine = templateEditor.setLineClass(0, 'activeline');
	});

});
