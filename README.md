Histone template engine [![Build Status](https://secure.travis-ci.org/MegafonWebLab/histone-javascript.png)](http://travis-ci.org/MegafonWebLab/histone-javascript)[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/17de6a6e7787895c686693a91cec57d8 "githalytics.com")](http://githalytics.com/MegafonWebLab/histone-javascript)
==================

Histone — powerful and flexible template engine, which can be used for
HTML - code generation as well as any other kind of text - documents.
Histone implementations exists for JavaScript ( **web - browsers** Safari,
Google Chrome, Mozilla FireFox, Opera and Internet Explorer 6 or higher,
**Node.js** and **Mozilla Rhino**) as well as for the [Java]
(https://github.com/MegafonWebLab/histone-java) and [PHP]
(https://github.com/MegafonWebLab/histone-php), it allows you to use same
templates on the server and on the client. Built - in extension mechanism allows
you to extend default template engine features, by adding your own methods and
properties for the particular project. Templates has clean and simple syntax and
can be stored either as source code or as compiled code that can be executed with
the maximum performance wherever it's needed.

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

Using Histone in Mozilla Rhino
--------------------------------------

First of all you'll have to download latest **js.jar** from [Mozilla Rhino official website]
(https://developer.mozilla.org/en-US/docs/Rhino).
Unless like Node.js, Mozilla Rhino supports two ways of loading external modules, first one
is using **load()** function (loads the file, and executes it in the global context, so the module should
export all it's vars into global namespace):

```javascript
// load Histone module, export into global namespace
load('Histone.js');
// create template instance
var template = Histone('2 x 2 = {{2 * 2}}');
// render template
template.render(function(result) {
    // output the result
    print(result);
});
```

To run the example, put the code into a file example.js and execute it with the java program:

```bash
> java -jar js.jar example.js
2 x 2 = 4
```

Histone can also be loaded as CommonJS module:

```javascript
// load Histone as CommonJS module
var Histone = require('./Histone.js');
// create template instance
var template = Histone('2 x 2 = {{2 * 2}}');
// render template
template.render(function(result) {
    // output the result
    print(result);
});
```

Mozilla Rhino doesn't support CommonJS by default, so in order to use it, you'll have to
explicitely turn it on in the commmand line. To run this example, put the code into a file
example.js and execute it with the java program:

```bash
> java -jar js.jar -main example.js
2 x 2 = 4
```

You can find more information about Mozilla Rhino CommonJS support here:
[http://www.angrycoding.com/2011/09/mozilla-rhino-commonjs-module-support.html]
(http://www.angrycoding.com/2011/09/mozilla-rhino-commonjs-module-support.html)

Creating template from a string
--------------------------------------

This is the most common way of instantiating templates, just pass template string while calling
Histone function as a first argument. Optional second argument can contain template's baseURI
(which is going to be used for resolving template's dependencies):

```javascript
// create template instance
var template = Histone('baseURI = {{baseURI}}', 'templates/template.tpl');
// render template
template.render(function(result) {
    // output the result
    console.info(result);
});
```

Creating template from DOM element
--------------------------------------

In case if you are using Histone in the web - browser, you might want to store your
template in the script tag. Histone provides you with convinient method for instantiating
template by passing a reference to the DOM element that contains a template (so you don't
need to extract it yourself):

```html
<!-- use script tag to store our template -->
<script id="template" type="text/html+template">
    2 x 2 = {{2 * 2}}
</script>

<script type="text/javascript">
    // create template instance
    var template = Histone(document.getElementById('template'));
    // render template
    template.render(function(result) {
        // output the result
        alert(result);
    });
</script>
```

Creating template from it's abstract syntax tree (AST)
--------------------------------------

String manipulations are very slow and heavy operations in every programming language.
When you are calling Histone function with the template argument passed as a string,
Histone has to parse your template before processing it, which is okay when you're
developing something but not very good for the production environments, where
performance is a key factor. Every template has **getAST()** method that allows
you to obtain it's abstract syntax tree (template's internal representation),
which can be used to construct the template using Histone function. This will
let you to skip template parsing process and do only it's execution, which
is way more faster than doing this all together:

```javascript
// constucting template from a string
var template = Histone('2 x 2 = {{2 * 2}}');
// obtaining template's AST: [["HISTONE"], ["2 x 2 = ", [11, [101, 2], [101, 2]]]]
var templateAST = template.getAST();
// alert template AST
alert(JSON.stringify(templateAST));
// constructing template from AST
var template = Histone([["HISTONE"], ["2 x 2 = ", [11, [101, 2], [101, 2]]]]);
// render template
template.render(function(result) {
    // output the result
    alert(result);
});
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
without the rest of it. In order to do that, just pass the name of the macro that you are
about to call as a first argument to render method:

```javascript
// create Template instance
var template = Histone('*** {{macro foo}} Hello world! {{/macro}} ***');
// process template's macro
template.render(
    // macro's name
    'foo',
    // result handler
    function(result) {
        // output the result
        alert(result);
    }
);
```

It's also possible to pass argument(s) into the macro that you wish to call:

```javascript
// create Template instance
var template = Histone('*** {{macro foo}} {{self.arguments.toJSON()}} {{/macro}} ***');
// process template's macro
template.render(
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

Reusing templates
--------------------------------------

You can reuse macros and variables that is defined in one template in the other template, so you don't
have to do it each time when you need it. For example you can move most used snippets into the base template
and then use it every time in work template. See the example:

```javascript
// create base Template instance (we are going to reuse it)
var baseTpl = Histone('{{macro hello(name)}} Hello {{name}}! {{/macro}}');
// create work Template instance
var workTpl = Histone('{{hello("world")}}');
// render base template
baseTpl.render(function(result, stack) {
    // render work template
    workTpl.render(function(result) {
        // output the result
        alert(result);
    },
    // pass stack instance (result of processing base template)
    stack
    );
});
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