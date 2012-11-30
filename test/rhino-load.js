var results = [];
results.push(typeof Histone === 'undefined');
load('../Histone.js');
results.push(typeof Histone === 'function');
Histone('{{2 * 2}}').render(function(result) {
	results.push(result);
	results = JSON.stringify(results);
	result = (results === '[true,true,"4"]');
	print('rhino-load.js: PASSING = ' + result);
	quit(!result);
});