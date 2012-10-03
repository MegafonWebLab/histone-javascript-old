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

	function uniqueId(prefix) {
		var old = new Date().getTime();
		var now = new Date().getTime();
		while (old === now) now = new Date().getTime();
		return (prefix + now.toString(16));
	}

	function onCursorActivity() {
		var currentLine = templateEditor.getCursor().line;
		templateEditor.setLineClass(hlLine, null, null);
		hlLine = templateEditor.setLineClass(currentLine, null, 'activeline');
	}

	function showPreloader(message) {
		preloaderEl.html(message);
		$('html').addClass('loading');
	}

	function hidePreloader() {
		preloaderEl.animate({opacity: 0}, function() {
			$('html').removeClass('loading');
			$(this).css('opacity', '');
		});
	}

	function setError(error) {
		consoleEl.html(error);
	}

	function setResult(result) {
		textResultEl.val(result);
		// alert(
			// MAKe A FUNCTION THAT MAKES JSONP REQUEST!!!!
			// SHARE ON TWITTER
			// iframe stuff
			// htmlResultEl[0].contentWindow.document.open();
			// htmlResultEl[0].contentWindow.document.write(result);
			// $(htmlResultEl[0].contentWindow.document.body).html(result);
			// );
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

	function saveGist() {
		showPreloader('saving example');
		var template = templateEditor.getValue();
		$.post('https://api.github.com/gists', JSON.stringify({
			'public': true, 'files': {
				'template': {
					'content': template
				}
			}
		}), function(gistData) {
			window.location.hash = gistData.id;
			hidePreloader();
		});
	}

	function loadGist(gistID, success, fail) {
		if (gistID && gistID.match('^[0-9]+$')) {
			showPreloader('loading template');
			var callbackID = uniqueId('loadGist');
			window[callbackID] = function(data) {
				delete window[callbackID];
				success(data, fail);
			};
			$.jsonp({url: [
				'https://api.github.com/gists/', gistID,
				'?callback=' + callbackID
			].join('')});
		} else fail();
	}

	function renderExamples(examplesList, treeViewTpl, callback) {
		$(examplesList).find('examples example').each(function() {
			var example = $(this);
			var exampleName = example.attr('name');
			var exampleData = example.text();
			exampleData = exampleData.replace(/\n\x09{2}/g, '\n');
			exampleData = exampleData.replace(/^\s\s*/, '');
			exampleData = exampleData.replace(/\s\s*$/, '');
			examples.push({
				title: exampleName,
				data: exampleData,
				id: examples.length,
			});
		});
		treeViewTpl.render(function(html) {
			sideBar.html(html);
			callback();
		}, {
			items: examples
		});
	}

	function treeViewItemClick() {
		var treeItem = $(this);
		var treeView = treeItem.closest('.-ui-treeView');
		if (treeItem.hasClass('-ui-treeView-item-selected')) return;
		var selected = $('.-ui-treeView-item-selected', treeView);
		selected.removeClass('-ui-treeView-item-selected');
		treeItem.addClass('-ui-treeView-item-selected');
		var treeItemId = treeItem.data('id');
		var exampleData = examples[treeItemId].data;
		templateEditor.setValue(exampleData);
		window.location.hash = '';
		templateEditor.focus();
	}

	require([
		'https://raw.github.com/MegafonWebLab/' +
		'histone-javascript/master/src/Histone.js',
		'https://raw.github.com/MegafonWebLab/' +
		'histone-javascript/master/src/Histone.js!../templates/treeView.tpl'
	], function(HistoneRef, treeViewTpl) {
		Histone = HistoneRef;
		showPreloader('loading examples');
		$.get('examples/examples.xml?' + Math.random(), function(result) {
			renderExamples(result, treeViewTpl, function() {
				$('.toolbar-save').on('click', saveGist);
				$('.toolbar-execute').on('click', processTemplate);
				$('.change-result-format').on('click', swapResultFormat);
				$('.-ui-treeView-item').on('mousedown', treeViewItemClick);
				resultFormatEl.on('change', updateResultFormat);
				hlLine = templateEditor.setLineClass(0, 'activeline');
				// var gistID = window.location.hash.split('#').pop();
				// loadGist(gistID, function(result, fail) {
				// 	try {
				// 		result = result.data.files;
				// 		result = result.template.content;
				// 		templateEditor.setValue(result);
				// 		processTemplate();
				// 		hidePreloader();
				// 	} catch (e) { fail(); }
				// }, function() {
					$('.-ui-treeView-item').first().trigger('mousedown');
					hidePreloader();
				// });
			});
		});
	});

});
