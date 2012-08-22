Histone template engine JavaScript - implementation
==================

Histone — powerful and flexible template engine, which can be used for
HTML - code generation as well as any other kind of text - documents.
Histone implementations exists for the web - browser as well as for the server
(Java and PHP), it allows you to use same templates on the server and on the
client. Built - in extension mechanism allows you to extend default template
engine features, by adding your own methods and properties for the particular
project. Templates has clean and simple syntax and can be stored either as
source code or as compiled code that can be executed with the maximum
performance wherever it's needed.

What you need to build Histone
--------------------------------------

In order to build Histone, you need to have [Apache ANT](http://ant.apache.org)
[installed](http://ant.apache.org/manual/index.html).

First, clone a copy of the Histone JavaScript git repo by running:

```bash
git clone git://github.com/MegafonWebLab/histone-javascript.git
```

Building Histone as RequireJS module
--------------------------------------

Enter the directory and build RequireJS module by running ant:

```bash
cd histone-javascript
ant
```

This will produce Histone.js in the same folder.

Building Histone as JavaScript library
--------------------------------------

Enter the directory and build RequireJS module by running ant:

```bash
cd histone-javascript
ant -Dresult=function
```

This will produce Histone.js in the same folder.

Using Histone
--------------------------------------

In case if you use Histone as RequireJS module:

```html
<!-- include RequireJS -->
<script type="text/javascript" src="http://requirejs.org/docs/release/2.0.6/minified/require.js"></script>
<script type="text/javascript">
	// load Histone module
	require(['../Histone'], function(Histone) {
		// create Template instance
		var template = Histone('2 x 2 = {{2 * 2}}');
		// render template
		template.render(function(result) {
			// output the result
			alert(result);
		});
	});
</script>
```

Important links
--------------------------------------

* [Project website](http://weblab.megafon.ru/histone/)
* [Documentation](http://weblab.megafon.ru/histone/documentation/)
* [Contributors](http://weblab.megafon.ru/histone/contributors/#JavaScript)