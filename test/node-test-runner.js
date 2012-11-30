/**
 * node-test-runner.js - Histone template engine.
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

var Histone = require('Histone');

// Histone('{{clientType}}').render(function(result) {
// 	result = (result === 'javascript/node');
// 	console.info(__filename, result);
// 	if (!result) process.exit(1);
// });

// Histone('{{loadText("resources/text.txt")}}', __filename).render(function(result) {
// 	result = (result === 'HELLO WORLD');
// 	console.info(__filename, result);
// 	if (!result) process.exit(1);
// });

// Histone('{{loadText("resources/NOT_FOUND.txt")}}', __filename).render(function(result) {
// 	result = (result === '');
// 	console.info(__filename, result);
// 	if (!result) process.exit(1);
// });

// Histone('{{loadJSON("resources/json.json").key}}', __filename).render(function(result) {
// 	result = (result === 'HELLO WORLD');
// 	console.info(__filename, result);
// 	if (!result) process.exit(1);
// });

// Histone('{{loadJSON("resources/json.jsonp", true).key}}', __filename).render(function(result) {
// 	result = (result === 'HELLO WORLD');
// 	console.info(__filename, result);
// 	if (!result) process.exit(1);
// });

// Histone('{{loadJSON("resources/json.jsonp").key}}', __filename).render(function(result) {
// 	result = (result === '');
// 	console.info(__filename, result);
// 	if (!result) process.exit(1);
// });

// Histone('{{loadJSON("resources/NOT_FOUND.json").key}}', __filename).render(function(result) {
// 	result = (result === '');
// 	console.info(__filename, result);
// 	if (!result) process.exit(1);
// });