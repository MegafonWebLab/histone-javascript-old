// RUN WITH:
// java -jar ../build/krang/java/js.jar -require rhino-require.js

var results = [];
results.push(typeof Histone === 'undefined');
var HistoneLocal = require('../Histone');
results.push(typeof Histone === 'undefined');
HistoneLocal('{{2 * 2}}').render(function(result) {
	results.push(result);
	results = JSON.stringify(results);
	result = (results === '[true,true,"4"]');
	print('rhino-require.js: PASSING = ' + result);
	quit(!result);
});