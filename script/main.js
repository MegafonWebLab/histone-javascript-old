$(document).ready(function() {

	var hlLine = 0;
	var Histone = null;
	var consoleEl =  $('.console');
	var resultEl = $('.right-column');
	var resultFormatEl = $('.result-format');
	var textResultEl = $('.text-area', resultEl);
	var htmlResultEl = $('.html-area', resultEl);
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
			resultEl.addClass('result-html');
		} else {
			resultEl.addClass('result-text');
			resultEl.removeClass('result-html');
		}
	}

	function swapResultFormat() {
		var resultFormat = getResultFormat();
		if (resultFormat === 'html') {
			setResultFormat('text');
		} else {
			setResultFormat('html');
		}
	}

	function updateResultFormat() {
		var resultFormat = getResultFormat();
		if (resultFormat === 'html') {
			setResultFormat('html');
		} else {
			setResultFormat('text');
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
