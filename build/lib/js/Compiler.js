/**
 * Compiler.js (v1.0) - Google Closure Compiler JavaScript interface.
 * Runs in Mozilla Rhino JavaScript engine and attempts to use
 * Google Closure Compiler to perform javascript optimization.
 * http://www.angrycoding.com/
 * Copyright (c) 2011 Ruslan Matveev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
with (exports) {

	/**
	 * Provides a separate namespace for most often used Java classes.
	 * @type {Object}
	 */
	const Java = JavaImporter(
		java.lang.Class,
		java.lang.String,
		java.lang.System,
		java.util.logging.Level,
		com.google.javascript.jscomp,
		com.google.javascript.jscomp.Compiler,
		com.google.javascript.jscomp.CompilerOptions,
		com.google.javascript.jscomp.CompilationLevel
	);

	exports.compile = function(sourceCode) {
		var jsCompilerOptions = new Java.CompilerOptions();
		jsCompilerOptions.setAssumeClosuresOnlyCaptureReferences(true);
		jsCompilerOptions.lineLengthThreshold = 9999;
		//jsCompilerOptions.inlineVariables = true;
		//jsCompilerOptions.inlineLocalVariables = true;
		//jsCompilerOptions.inlineFunctions = true;
		//jsCompilerOptions.inlineLocalFunctions = true;
		// SIMPLE_OPTIMIZATIONS
		//ADVANCED_OPTIMIZATIONS

		Java.CompilationLevel.SIMPLE_OPTIMIZATIONS.setOptionsForCompilationLevel(
			jsCompilerOptions
		);
		var jsSourceFilefromCode = (
			Java.Class.forName('com.google.javascript.jscomp.JSSourceFile').
			getMethod('fromCode', [Java.String, Java.String])
		);
		var jsCompilerExtern = jsSourceFilefromCode.invoke(null,[
			//var RegExp = {'exec': function(){}};var String = {'replace': function(){}};
			"externs.js", ""
		]);
		var jsCompilerInput = jsSourceFilefromCode.invoke(null,[
			"input.js", sourceCode
		]);
		Java.Compiler.setLoggingLevel(Java.Level.WARNING);
		var compiler = new Java.Compiler(Java.System.err);
		compiler.compile(jsCompilerExtern, jsCompilerInput, jsCompilerOptions);
		return String(compiler.toSource());
	};
}