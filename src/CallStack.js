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

define(['Utils', 'OrderedMap'], function(Utils, OrderedMap) {

	function CallStack(global, context, getProp) {
		this.variables = [{}];
		this.stackPointer = 0;
		this.global = global;
		this.context = context;
		this.getProp = getProp;
		this.baseURI = '';
	}

	CallStack.prototype.setBaseURI = function(baseURI) {
		this.baseURI = baseURI;
	};

	CallStack.prototype.getBaseURI = function() {
		return this.baseURI;
	};

	CallStack.prototype.put = function(name, value) {
		this.variables[this.stackPointer][name] = value;
	};

	CallStack.prototype.get = function(name, ret) {

		if (name === 'global') return ret(this.global);
		if (name === 'this') return ret(this.context);

		var stacks = this.variables;
		var stack, context, index = this.stackPointer;

		do {
			stack = stacks[index];
			if (stack.hasOwnProperty(name)) {
				return ret(stack[name]);
			}
		} while (index--);

		if (Utils.isObject(context = this.context) &&
			context instanceof OrderedMap &&
			context.hasKey(name)) {
			return ret(context.get(name));
		}

		this.getProp(this.global, name, this, ret);
	};

	CallStack.prototype.save = function() {
		this.variables.push({});
		this.stackPointer++;
	};

	CallStack.prototype.restore = function() {
		this.variables.pop();
		this.stackPointer--;
	};

	CallStack.prototype.clone = function() {
		var callStack = new CallStack(
			this.global,
			this.context,
			this.getProp
		);
		var key, iterator = (this.stackPointer + 1);
		var tVars = this.variables;
		var cVars = new Array(iterator);
		while (iterator--) {
			cVars[iterator] = {};
			for (key in tVars[iterator]) {
				cVars[iterator][key] = tVars[iterator][key];
			}
		}
		callStack.variables = cVars;
		return callStack;
	};

	return CallStack;

});