/**
 * CallStack.js - Histone template engine.
 * Copyright 2012 MegaFon
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(function() {

	function CallStack(context) {
		this.baseURI = '';
		this.vars = [{}];
		this.macros = [{}];
		this.stackPointer = 0;
		this.context = context;
	}

	CallStack.prototype.setBaseURI = function(baseURI) {
		this.baseURI = baseURI;
	};

	CallStack.prototype.getBaseURI = function() {
		return this.baseURI;
	};

	CallStack.prototype.putVar = function(name, value) {
		this.vars[this.stackPointer][name] = value;
	};

	CallStack.prototype.getVar = function(name, ret) {
		var stacks = this.vars;
		var stack, index = this.stackPointer;
		do {
			stack = stacks[index];
			if (stack.hasOwnProperty(name)) {
				return ret(stack[name], true);
			}
		} while (index--);
		ret();
	};

	CallStack.prototype.putMacro = function(name, args, body, baseURI) {
		this.macros[this.stackPointer][name] = [args, body, baseURI];
	};

	CallStack.prototype.getMacro = function(name) {
		var stacks = this.macros;
		var stack, index = this.stackPointer;
		do {
			stack = stacks[index];
			if (stack.hasOwnProperty(name)) {
				return stack[name];
			}
		} while (index--);
	};

	CallStack.prototype.save = function() {
		this.vars.push({});
		this.macros.push({});
		this.stackPointer++;
	};

	CallStack.prototype.restore = function() {
		this.vars.pop();
		this.macros.pop();
		this.stackPointer--;
	};

	CallStack.prototype.clone = function() {
		var callStack = new CallStack(this.context);
		var key, iterator = (this.stackPointer + 1);
		var tVars = this.vars;
		var tMacros = this.macros;
		var cVars = new Array(iterator);
		var cMacros = new Array(iterator);
		while (iterator--) {
			cVars[iterator] = {};
			cMacros[iterator] = {};
			for (key in tVars[iterator]) {
				cVars[iterator][key] = tVars[iterator][key];
			}
			for (key in tMacros[iterator]) {
				cMacros[iterator][key] = tMacros[iterator][key];
			}
		}
		callStack.vars = cVars;
		callStack.macros = cMacros;
		return callStack;
	};

	return CallStack;

});