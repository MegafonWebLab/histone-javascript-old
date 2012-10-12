Histone template engine [![Build Status](https://secure.travis-ci.org/MegafonWebLab/histone-javascript.png)](http://travis-ci.org/MegafonWebLab/histone-javascript)
==================

Histone — powerful and flexible template engine, which can be used for
HTML - code generation as well as any other kind of text - documents.
Histone implementations exists for JavaScript (**web - browsers** Safari,
Google Chrome, Mozilla FireFox, Opera and Internet Explorer 6 or higher,
**Node.js** and **Mozilla Rhino**) as well as for the Java and PHP, it
allows you to use same templates on the server and on the client.
Built - in extension mechanism allows you to extend default template engine
features, by adding your own methods and properties for the particular project.
Templates has clean and simple syntax and can be stored either as source code or
as compiled code that can be executed with the maximum performance wherever it's needed.

See live demo here:
[http://megafonweblab.github.com/histone-javascript/](http://megafonweblab.github.com/histone-javascript/)

What you need to build Histone
--------------------------------------

In order to build Histone, you need to have [Apache ANT](http://ant.apache.org)
[installed](http://ant.apache.org/manual/index.html).

First, clone a copy of the Histone JavaScript git repo by running:

```bash
> git clone git://github.com/MegafonWebLab/histone-javascript.git
```

or just download ZIP - archive from this webpage.

Building Histone
--------------------------------------

Enter the directory and build Histone by running **ant** without arguments:

```bash
> cd histone-javascript
> ant
```

This will produce minified **Histone.js** in the same folder.

Running automated tests
--------------------------------------

Enter the directory and execute test target:

```bash
> cd histone-javascript
> ant test
```

This will build Histone.js, obtain latest test files from
[https://github.com/MegafonWebLab/histone-acceptance-tests.git](https://github.com/MegafonWebLab/histone-acceptance-tests.git)
and test Histone against them, using [Mozilla Rhino Javascript engine](https://developer.mozilla.org/en-US/docs/Rhino).
You can also check current build status on [Travis CI continuous integration server](https://travis-ci.org/#!/MegafonWebLab/histone-javascript).

Using Histone in the web - browser
--------------------------------------

In case if you use Histone as RequireJS module:

```html
<!-- include RequireJS -->
<script type="text/javascript" src="http://requirejs.org/docs/release/2.0.6/minified/require.js"></script>
<script type="text/javascript">
	// load Histone module
	require(['Histone'], function(Histone) {
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

In case if you prefer to use pure JavaScript - library:

```html
<!-- include Histone library -->
<script type="text/javascript" src="Histone.js"></script>
<script type="text/javascript">
    // create Template instance
    var template = Histone('2 x 2 = {{2 * 2}}');
    // render template
    template.render(function(result) {
        // output the result
        alert(result);
    });
</script>
```

**NOTE**: Histone depends on JSON serialization and deserialization, so in case if you are
planning to use Histone in **Internet Explorer 7 or lower** (where JSON
implementation is missing), you'll have to include a script that implements it
 (you can find more information on [http://json.org/](http://json.org/)). Histone
playground application uses [JSON implementation developed by Douglas Crockford]
(https://github.com/douglascrockford/JSON-js):

```html
<!--[if lte IE 7]>
	<!-- include JSON - implementation -->
	<script type="text/javascript" src="json2.js"></script>
<![endif]-->
<!-- include Histone library -->
<script type="text/javascript" src="Histone.js"></script>
```

To run the examples, put the code into a file index.html and open it with your web - browser.

Using Histone in Node.js
--------------------------------------

Using Histone in Node.js projects is trivial, just load Histone module,
create a Template instance and call render when needed:

```javascript
// load Histone module
var Histone = require('./Histone.js');
// create Template instance
var template = Histone('2 x 2 = {{2 * 2}}');
// render template
template.render(function(result) {
    // output the result
    console.info(result);
});
```

To run the example, put the code into a file example.js and execute it with the node program:

```bash
> node example.js
2 x 2 = 4
```

Passing JavaScript - variables
--------------------------------------

Use second argument to pass any JavaScript value into template:

```javascript
// create Template instance
var template = Histone('this.foo = {{this.foo}}');
// render template
template.render(function(result) {
    // output the result
    alert(result);
}, {'foo': 'bar'});
```

Calling template's macros
--------------------------------------

It's possible to process a macro, that is defined in the template,
without the rest of it:

```javascript
// create Template instance
var template = Histone('*** {{macro foo}} {{self.arguments.toJSON()}} {{/macro}} ***');
// process template's macro
template.call(
    // macro's name
    'foo',
    // macro's arguments
    [1, 2, 3],
    // result handler
    function(result) {
        // output the result
        alert(result);
    }
);
```

Dependency management
--------------------------------------

Templates can contain calls to the functions that performs external resource
loading. You can manage resouce loading by setting up your own URI - resolver:

```javascript
// set up our own URI - resolver
Histone.setURIResolver(function(href, base, ret, options) {
    // href - contains full path to the requested resource
    // base - contains path to the template that is requesting resource
    // ret - callback function that has to be called to retrieve the result
    // options - special parameters array

    // handle only "file:" protocol requests
    if (href.substr(0, 5) === 'file:') {
        // do something
        ret('resource contents as string', 'requested resource baseURI');
        // tell the engine that we can handle this request
        return true;
    }
    // here we return to the default resource loader
});

// create Template instance
var template = Histone('{{loadText("file:///foobar")}}');
// render template
template.render(function(result) {
    // output the result
    alert(result);
});
```

Extending the engine
--------------------------------------

You can extend template engine by implementing your own functions,
methods and properties:

```javascript
// define global function random
Histone.Global.random = function(value, args, ret) {
    // this - contains the reference to the instance of the CallStack class
    // value - contains the reference to the value (in this case it's Histone.Global object)
    // args - contains an array of function call arguments
    // ret - callback - function that you have to call for returning the result

    ret(Math.random());
};

// define function on the values of any data type
Histone.Type.toHTML = function(value, args, ret) {
    // this - contains the reference to the instance of the CallStack class
    // value - contains the reference to the value (in this case it's Histone.Global object)
    // args - contains an array of function call arguments
    // ret - callback - function that you have to call for returning the result

    ret('<div>' + value + '</div>');
};

// define function on the values of the string data type
Histone.String.repeat = function(value, args, ret) {
    // this - contains the reference to the instance of the CallStack class
    // value - contains the reference to the value (in this case it's Histone.Global object)
    // args - contains an array of function call arguments
    // ret - callback - function that you have to call for returning the result

    var result = '';
    var times = parseInt(args[0]);
    if (isNaN(times) || times <= 0) return ret(value);
    for (var c = 0; c <= times; c++) result += value;
    ret(result);
};

// test Global.random function
Histone('{{random()}}').render(function(result) {
    // output the result
    alert(result);
});

// test Type.toHTML function
Histone('{{123.toHTML()}}').render(function(result) {
    // output the result
    alert(result);
});

// test String.repeat function
Histone('{{"A".repeat(5)}}').render(function(result) {
    // output the result
    alert(result);
});
```

Important links
--------------------------------------

* [Histone playground](http://megafonweblab.github.com/histone-javascript/)
* [Project website](http://weblab.megafon.ru/histone/en/)
* [Documentation](http://weblab.megafon.ru/wiki/display/HistoneDocEN/Documentation)
* [Follow us on twitter](https://twitter.com/intent/follow?screen_name=MegafonWebLab)
* [Syntax highlighters](https://github.com/MegafonWebLab/histone-syntax-highlighting)
* [Contributors](http://weblab.megafon.ru/histone/en/contributors/#JavaScript)