Histone template engine
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

or just download ZIP - archive from this webpage.

Building Histone
--------------------------------------

Enter the directory and build RequireJS module by running ant without arguments:

```bash
cd histone-javascript
ant
```

This will produce Histone.js in the same folder. In case if you want to build
pure JavaScript - library, run ant with following arguments:

```bash
ant -Dresult=function
```

Using Histone
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

* [Project website](http://weblab.megafon.ru/histone/)
* [Documentation](http://weblab.megafon.ru/histone/documentation/)
* [Contributors](http://weblab.megafon.ru/histone/contributors/#JavaScript)[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/1389529509962450480eeeaf65162196 "githalytics.com")](http://githalytics.com/MegafonWebLab/histone-javascript)