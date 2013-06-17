(function(t){var e=t,r=function(){function t(t,e,r){return e?u[e]:String.fromCharCode(parseInt(r,16))}function e(e,r){var n,i=e.match(o),a=i[0],u=!1;"{"===a?n={}:"["===a?n=[]:(n=[],u=!0);for(var l,h=[n],d=1-u,g=i.length;g>d;++d){a=i[d];var y;switch(a.charCodeAt(0)){default:y=h[0],y[l||y.length]=+a,l=void 0;break;case 34:if(a=a.substring(1,a.length-1),-1!==a.indexOf(f)&&(a=a.replace(s,t)),y=h[0],!l){if(!(y instanceof Array)){l=a||c;break}l=y.length}y[l]=a,l=void 0;break;case 91:y=h[0],h.unshift(y[l||y.length]=[]),l=void 0;break;case 93:h.shift();break;case 102:y=h[0],y[l||y.length]=!1,l=void 0;break;case 110:y=h[0],y[l||y.length]=null,l=void 0;break;case 116:y=h[0],y[l||y.length]=!0,l=void 0;break;case 123:y=h[0],h.unshift(y[l||y.length]={}),l=void 0;break;case 125:h.shift()}}if(u){if(1!==h.length)throw Error();n=n[0]}else if(h.length)throw Error();if(r){var v=function(t,e){var n=t[e];if(n&&"object"==typeof n){var i=null;for(var a in n)if(p.call(n,a)&&n!==t){var o=v(n,a);void 0!==o?n[a]=o:(i||(i=[]),i.push(a))}if(i)for(var s=i.length;--s>=0;)delete n[i[s]]}return r.call(t,e,n)};n=v({"":n},"")}return n}function r(t){var e=typeof t;if("object"!=e||null===t)return"string"==e&&(t='"'+t+'"'),t+"";var n,i,a=[],o=t&&t.constructor==Array;for(n in t)i=t[n],e=typeof i,"string"==e?i='"'+i+'"':"object"==e&&null!==i&&(i=r(i)),a.push((o?"":'"'+n+'":')+(i+""));return(o?"[":"{")+(a+"")+(o?"]":"}")}var n="(?:-?\\b(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?\\b)",i='(?:[^\\0-\\x08\\x0a-\\x1f"\\\\]|\\\\(?:["/\\\\bfnrt]|u[0-9A-Fa-f]{4}))',a='(?:"'+i+'*")',o=RegExp("(?:false|true|null|[\\{\\}\\[\\]]|"+n+"|"+a+")","g"),s=RegExp("\\\\(?:([^u])|u(.{4}))","g"),u={'"':'"',"/":"/","\\":"\\",b:"\b",f:"\f",n:"\n",r:"\r",t:"	"},c=new String(""),f="\\",p=Object.hasOwnProperty;return{parse:e,stringify:r}}(),n=function(t,e){function r(t,e){var r=t.charAt(e),n=x.indexOf(r);if(-1===n)throw"illegal `"+r+"` character";return n}function n(t){var t=t.split("/"),e=""===t[0],r=[],n="";for(e&&t.shift();t.length;)n=t.shift(),".."===n?r.pop():"."!==n&&r.push(n);return e&&r.unshift(""),("."===n||".."===n)&&r.push(""),r.join("/")}function i(t){return void 0===t}function a(t){return"boolean"==typeof t}function o(t){return"string"==typeof t}function s(t){return t instanceof Array}function u(t){return t instanceof Function}function c(t){return t instanceof Object&&!(t instanceof Function)&&!(t instanceof Array)}function f(t){var e,n,i=[],a=0,t=t+"",o=t.length;if(!o)return t;if(o%4)throw"incorrect padding";for("="===t.charAt(o-1)&&(a=1,"="===t.charAt(o-2)&&(a=2),o-=4),e=0;o>e;e+=4)n=r(t,e)<<18,n|=r(t,e+1)<<12,n|=r(t,e+2)<<6,n|=r(t,e+3),i.push(String.fromCharCode(n>>16,255&n>>8,255&n));return a&&(n=r(t,e)<<18,n|=r(t,e+1)<<12,i.push(String.fromCharCode(n>>16)),1===a&&(n|=r(t,e+2)<<6,i.push(String.fromCharCode(255&n>>8)))),i.join("")}function p(t,e){return null!==t&&void 0!==t&&"string"==typeof e&&Object.prototype.hasOwnProperty.call(t,e)}function l(t){if(c(t)){var e={};for(var r in t)e[r]=l(t[r]);return e}if(s(t)){for(var e=Array(t.length),n=0;t.length>n;n++)e[n]=l(t[n]);return e}return t}function h(){var t,e,r,n,a={},o=arguments.length;for(t=0;o>t;t++)if(c(n=arguments[t]))for(e in n)p(n,e)&&(i(r=n[e])?p(a,e)&&delete a[e]:a[e]=p(a,e)&&c(a[e])&&c(r)?h(a[e],r):c(r)?h(r):r);return a}function d(t,e,r,n){u(r)||(r=null),i(t)?t=[]:s(t)||(t=[t]);var a=t.length,o=Array(a);if(u(e)&&a){var c,f=a;for(c=0;a>c;c++)e.call(n,t[c],function(t){return function(e){o[t]=e,--f||r&&r.call(n,o)}}(c),c)}else r&&r.call(n,o)}function g(r){return i(t.JSON)?e.parse(r):t.JSON.parse(r)}function y(r){return i(t.JSON)?e.stringify(r):t.JSON.stringify(r)}function v(t){return o(t)?t.replace(/^\s+/,""):""}function m(t){return o(t)?t.replace(/\s+$/,""):""}function w(t,e,r){if(!o(t))return!1;if(!o(e))return!1;var n=t.substr(0,e.length);return r&&(e=e.toLowerCase(),n=n.toLowerCase()),e===n}function b(t){var e=t.match(F),r=(e[1]||"").toLowerCase(),n=(e[2]||"").toLowerCase(),i=e[3]||"",a=i.split("/").pop(),o=a.match(C);return o=o&&o[1]||"","http"===r&&":80"===n.slice(-3)?n=n.slice(0,-3):"https"===r&&":443"===n.slice(-4)&&(n=n.slice(0,-4)),{scheme:r,authority:n,path:i,fileName:a,fileType:o,query:e[4]||"",fragment:e[5]||""}}function A(t){if(o(t)&&w(t,"data:",!0)){var e=t.substr(5).split(",");if(!(2>e.length)){t=e.shift().split(";");for(var r={encoding:"",data:e.join(","),params:{charset:"US-ASCII"},type:t.shift()||"text/plain"};t.length;)e=t.shift().split("="),o(e[1])?r.params[e[0]]=e[1]:r.encoding=e[0];return r}}}function O(t){var e={};return o(t)?(t.replace(RegExp("([^?=&]+)(=([^&]*))?","g"),function(t,r,n,i){e[r]=i}),e):{}}function S(t){return(t.scheme?t.scheme+"://":"")+(t.authority?t.authority:"")+(t.path?t.path:"")+(t.query?"?"+t.query:"")+(t.fragment?"#"+t.fragment:"")}function T(t){var e,r=[];if(!c(t))return"";for(e in t)t.hasOwnProperty(e)&&r.push(e+"="+t[e]);return r.join("&")}function E(t,e){var r=t,i=e;o(r)&&(r=b(r)),o(i)&&(i=b(i));var a="",s="";return r.scheme?(a+=r.scheme+":",(s=r.authority)&&(a+="//"+s),(s=n(r.path))&&(a+=s),(s=r.query)&&(a+="?"+s)):((s=i.scheme)&&(a+=s+":"),(s=r.authority)?(a+="//"+s,(s=n(r.path||""))&&(a+=s),(s=r.query)&&(a+="?"+s)):((s=i.authority)&&(a+="//"+s),(s=r.path)?((s=n("/"===s.charAt(0)?s:(i.authority&&!i.path?"/":(i.path.match(j)||[""])[0])+s))&&(a+=s),(s=r.query)&&(a+="?"+s)):((s=i.path)&&(a+=s),((s=r.query)||(s=i.query))&&(a+="?"+s)))),(s=r.fragment)&&(a+="#"+s),a}var j=/^(.*)\//,C=/.+\.([^\.]+)$/,x="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",F=/^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;return{isUndefined:i,isBoolean:a,isString:o,isArray:s,isFunction:u,isMap:c,mapAsync:d,base64decode:f,hasOwnProperty:p,json:{parse:g,stringify:y},object:{clone:l,merge:h},string:{trimLeft:v,trimRight:m,startsWith:w},uri:{parse:b,parseQuery:O,format:S,formatQuery:T,resolve:E,parseData:A}}}(e,r),i=function(t){var e={};if("object"==typeof t.window&&"object"==typeof t.window.navigator&&"string"==typeof t.window.navigator.userAgent){var r,n=t.window.navigator.userAgent;(r=n.match(/AppleWebKit\/([\d.]+)/))?(e.webkit={version:parseFloat(r[1])},(r=n.match(/Chrome\/([\d.]+)/))?e.chrome={version:parseFloat(r[1])}:(r=n.match(/Version\/([\d.]+)/))&&(e.safari={version:parseFloat(r[1])})):(r=n.match(/Gecko\/([\d.]+)/))?(e.gecko={version:parseFloat(r[1])},(r=n.match(/Firefox\/([\d.]+)/))&&(e.firefox={version:parseFloat(r[1])})):(r=n.match(/MSIE\s([\d.]+)/))?e.ie={version:parseFloat(r[1])}:(r=n.match(/Opera\/([\d.]+)/))&&(e.opera={version:parseFloat(r[1])},(r=n.match(/Version\/([\d.]+)/))&&(e.opera={version:parseFloat(r[1])})),e={browser:e}}else if("object"==typeof t.process&&"string"==typeof t.process.version){var r=t.process.version;r=r.match(/\d+\.\d+[\.\d+]*/),e.nodejs={version:parseFloat(r[0])}}return e}(e),a=function(t,e){function r(){var t=Array.prototype.slice.call(arguments);t.unshift("[ KRANG ]"),console.log(t.join(" "))}function n(t,e){return{file:t,toString:function(){return e}}}function i(t,e){return n(t,'dependency must be a string or array, but "'+e+'" found ('+t+")")}function a(t,e){return n(t,'failed to resolve dependency alias "@'+e+'" for "'+t+'"')}function o(t,e,r){return n(t,'failed to load dependency "'+e+'" for "'+t+'" '+'with message "'+r+'"')}function s(t){return n(t,'failed to load dependency "'+t+'" '+'with message "missing required define call"')}function u(t){return n(t,'failed to load dependency "'+t+'" '+'with message "duplicate define call"')}function c(t,e,r){if(h.hasOwnProperty(t))throw new u(t);h[t]=!0;var n,e=Array.prototype.slice.call(e),i=e.shift();e.length&&(n=i,i=e.shift()),r(n,i)}function f(){return e.nodejs?module.parent.filename:e.browser?t.location.href:void 0}function p(){var r;if(r=arguments.callee.caller)do if(r.hasOwnProperty("currentScript"))return{src:r.currentScript};while(r=r.caller);if(e.browser){if(t.document&&t.document.currentScript)return t.document.currentScript;try{throw Error()}catch(n){if(n.stack){r=n.stack,-1===r.indexOf("@")?(r=r.split("\n").pop(),r=r.split(" ").pop()):r=r.split("@").pop(),r=r.split(/(\:\d+)+\s*$/).shift();for(var i=0;l.length>i;i++)if(l[i].src===r)return l[i]}else for(var i=0;l.length>i;i++)if("interactive"===l[i].readyState)return l[i]}}}var l=[],h={};return e.browser&&t.document&&t.document.getElementsByTagName&&(l=document.getElementsByTagName("script")),{T_VALUE:1,T_CONFIG:2,T_GLOBAL:3,T_MODULE:4,T_RESOURCE:5,VERSION:"0.0.7",message:r,define:c,getBaseURI:f,getCurrentScript:p,TypeException:i,AliasException:a,LoadException:o,MissingDefinition:s}}(e,i),o=function(t){function e(e){return t.isString(e)||(e=""),u.hasOwnProperty(e)?u[e]:u[e]={uses:{},views:{}}}function r(r,n){var i=e(r);return t.isString(n)||(n=""),i.views.hasOwnProperty(n)?i.views[n]:i.views[n]={status:a,waiting:[]}}function n(t,e){if(t===e)return!0;for(var r in u[t].uses)if(n(r,e))return!0}function i(t,e){t.data=e,t.status=s;for(var r=t.waiting;r.length;)r.shift()(e)}var a=0,o=1,s=2,u={};return function(){var a,u,c,f,p,l=Array.prototype.slice.call(arguments);t.isString(l[0])&&(a=l.shift()),t.isString(l[0])&&(u=l.shift()),t.isFunction(l[0])&&(f=l.shift()),t.isFunction(l[0])&&(c=l.shift()),t.isString(l[0])&&(p=l.shift());var h=r(a,u);if(h.status===s)return f?f(h.data):h.data;if(t.isString(p)&&(e(p).uses[a]=!0,n(a,p)))throw p+" refers back to "+a;f&&h.waiting.push(f),h.status!==o&&(h.status=o,c?c(a,function(t){i(h,t)},p):i(h))}}(n),s=function(t,e){function r(){o||(o=!0,i=require("url"),a={file:require("fs"),http:require("http"),https:require("https")})}function n(n,o,s){r();var u=t.uri.parse(n),c=u.scheme||"file";"http"===c||"https"===c?a[c].request({method:"GET",path:[u.path,u.query].join("?"),hostname:u.authority},function(t){if(t.statusCode>300&&400>t.statusCode&&t.headers.location){var r=i.parse(t.headers.location);return r.port||(r.port=u.port),r.host||(r.host=u.host),r.hostname||(r.hostname=u.hostname),r.protocol||(r.protocol=u.protocol),doHTTPRequest(r,o,s)}var a="";t.on("end",function(){try{var t=!1,r=Function("define, require, module",a);if(r.currentScript=n,r(function(){t=!0,e.define(n,arguments,o)},require,module),!t)throw new e.MissingDefinition(n)}catch(i){s(i)}}).on("data",function(t){a+=t})}).on("error",s).end():"file"===c?a[c].readFile(u.path,function(t,r){if(t)return s(t);try{Function("define, require, module",""+r)(function(){e.define(n,arguments,o)},require,module)}catch(i){s(i)}}):s("unsupported scheme:"+c)}var i,a,o=!1;return n}(n,a),u=function(t,e,r){function n(){for(var t=!1,e=0;u.length>e;e++)try{t=u[e]();break}catch(r){}return t}function i(t,r){var t=e.uri.parse(t),r=e.uri.parse(r);return t.scheme==r.scheme&&t.authority===r.authority}function a(t,e){var n=document.createElement("script");n.setAttribute("type","text/javascript"),n.setAttribute("async","async"),n.setAttribute("src",t),s[t]=e,n.onload=function(){if(!s[this.src].called)throw new r.MissingDefinition(this.src)},document.getElementsByTagName("head")[0].appendChild(n)}function o(t,e,i){var a=n();if(!a)return i("could not instantiate XMLHttpRequest");try{a.open("GET",t,!0),a.onreadystatechange=function(){if(4===a.readyState){var n=a.status;if(200!==n)return i("not found");try{var o=!1,s=Function("define",a.responseText);if(s.currentScript=t,s(function(){o=!0,r.define(t,arguments,e)}),!o)throw new r.MissingDefinition(t)}catch(u){i(u)}}},a.send(null)}catch(o){i(o)}}var s={};t.define=function(){var t=r.getCurrentScript();if(!t)return!1;var e=t.src;if(!s.hasOwnProperty(e))return!1;var n=s[e];return n.called=!0,r.define(e,arguments,n),!0};var u=[function(){return new XMLHttpRequest},function(){return new ActiveXObject("Msxml2.XMLHTTP")},function(){return new ActiveXObject("Msxml3.XMLHTTP")},function(){return new ActiveXObject("Microsoft.XMLHTTP")}];return function(t,e,r){i(window.location.href,t)?o(t,e,r):a(t,e,r)}}(e,n,a),c=function(t,e,r,n){var i=null;return e.nodejs?i=r:e.browser&&(i=n),function(e,r,n,a){if(t.isString(r)){if(t.isFunction(a)||(a=function(){}),t.isFunction(n)||(n=function(){}),!e.cache){r=t.uri.parse(r);var o=t.uri.parseQuery(r.query);o["krang.nocache"]=(new Date).getTime(),r.query=t.uri.formatQuery(o),r=t.uri.format(r)}i(r,n,a)}}}(n,i,s,u),f=function(t,e,r,n,i){function a(e,r){try{var n=t.uri.parseData(r),i=n.data;return i="base64"===n.encoding?t.base64decode(i):decodeURIComponent(i),"application/json"===n.type&&(i=t.json.parse(i)),i}catch(a){}}function o(e,r){var e=t.uri.parse(e);return e.fragment="",e.path=e.path.replace(/\/+/g,"/"),e.fileName&&!e.fileType&&(e.path+=".js"),t.uri.resolve(e,r)}function s(e){t.isString(e)||(e="");var r=(new Date).getTime();return e+r.toString(36)+(1+Math.floor(32767*Math.random())).toString(36)+(1+Math.floor(32767*Math.random())).toString(36)}function u(){return s("__KRANG"+ ++p+"__")+"__"}function c(e){return t.isUndefined(e)||(e+=""),e?f.hasOwnProperty(e)?f[e]:f[e]=u():u()}var f={},p=0;return function(r,s,u){function f(t,n,a){r.debug&&e.message("loading",t),i(r,t,function(e,r){d(t,e,function(t){n([t,r])})},function(r){throw new e.LoadException(a,t,r)})}function p(n,i,a,o){if(t.hasOwnProperty(r,"packages")&&t.hasOwnProperty(r.packages,i))return i=r.packages[i],a&&(i+="!"+a),l(n,i,o);throw new e.AliasException(n,i)}function l(i,s,u){var s=t.string.trimLeft(s);if(t.string.startsWith(s,"data:",!0))return u({type:e.T_VALUE,base:i,data:a(i,s)});s=t.string.trimRight(s);var l=s.replace(/\s*!+\s*/g,"!");if(l=l.split("!"),!(s=l.shift())){if("global"===l[0])return u({id:c(["global",l]),type:e.T_GLOBAL,base:i,data:l});if("module"===l[0])return u({id:c(["module",i,l]),type:e.T_MODULE,base:i,data:l});if("config"===l[0])return u({id:c(["config",l,JSON.stringify(r.config)]),type:e.T_CONFIG,base:i,data:l});throw"Unknown system plugin call: "+l[0]}return l=l.join("!"),"@"===s[0]?(s=s.substr(1),p(i,s,l,u)):(s=o(s,i),n(s,function(){u({id:c(["resource",s,l]),type:e.T_RESOURCE,base:i,uri:s,data:l})},f,i),void 0)}function h(r,n,i){if(!t.isString(n))throw new e.TypeException(r,n);l(r,n,i)}function d(e,r,n){t.mapAsync(r,function(t,r){h(e,t,r)},n)}d(r.baseURI,s,u)}}(n,a,i,o,c),p=function(t,e,r,n){function i(i,a,o,s,u){function c(a,o){r.mapAsync(a,function(a,o){var f=a.base;if(a.type===e.T_RESOURCE){var p=a.uri,l=a.data;n(p,"evaluated",function(t){l&&r.hasOwnProperty(t,"krang")&&r.isFunction(t.krang)?t.krang(f,l,o,s,u):o(t)},function(t,a){i.debug&&e.message("evaluating",t);var o=n(t),s=o[1],u=o[0];return r.isFunction(s)?(c(u,function(t){a(s.apply(this,t))}),void 0):a(s)})}else a.type===e.T_GLOBAL?o(t):a.type===e.T_MODULE?o({uri:f}):a.type===e.T_CONFIG?o(i.config):a.type===e.T_VALUE&&o(a.data)},o)}c(a,o)}return i}(e,a,n,o),l=function(t,e,r,n){function i(t,r){return e.isFunction(t)?"("+(t+"")+")("+r+")":e.isUndefined(t)?"undefined":JSON.stringify(t)}function a(a,o,s,u){function c(o,s,l){e.mapAsync(o,function(e,o){var s=e.id;if(p.hasOwnProperty(s))return o(s);p[s]=!0;var h=e.type;if(h===t.T_RESOURCE){var d=e.data,g=r(e.uri),y=g[1],v=g[0];return d?n(a,e,function(t){for(var t=t[0],e=0;t.length>e;e++)p.hasOwnProperty(t[e].exportAs)||(t[e].main&&(t[e].main=l,t[e].exportAs=s),f.push(t[e]));o(s)},u,!0):c(v,function(t){f.push({type:"value",main:l,exportAs:s,data:i(y,t)}),o(s)})}h===t.T_GLOBAL?f.push({type:"global",main:l,exportAs:s,data:e.data}):h===t.T_MODULE?f.push({type:"module",main:l,exportAs:s,data:e.data}):h===t.T_CONFIG?f.push({type:"value",main:l,exportAs:s,data:i(a.config)}):h===t.T_VALUE&&f.push({type:"value",main:l,exportAs:s,data:i(e.data)}),o(s)},s)}var f=[],p={};c(o,function(){s(f)},!0)}return a}(a,n,o,p),h=function(t,e,r,n,i,a){function o(e){var r=[],n=null,i=Array.prototype.slice.call(e);return t.isString(i[0])?r=[i.shift()]:t.isArray(i[0])&&(r=i.shift()),t.isFunction(i[0])&&(n=i.shift()),[r,n]}function s(e,r){var n=e.baseURI,r=t.object.clone(r);if(t.hasOwnProperty(r,"baseURI")&&(t.isString(r.baseURI)?n=r.baseURI=t.uri.resolve(r.baseURI,n):delete r.baseURI),t.hasOwnProperty(r,"cache")&&!t.isBoolean(r.cache)&&(r.cache=r.cache+""),t.hasOwnProperty(r,"packages")){var i=r.packages;if(t.isMap(i)){var a,o;for(a in i)o=i[a],o=t.string.trimLeft(o),t.isString(o)?i[a]=t.uri.resolve(o,n):delete i[a]}else t.isUndefined(i)||delete r.packages}return t.object.merge(e,r)}function u(r){function c(t){return u(s(r,t))}return r.debug&&e.message("applying configuration:",t.json.stringify(r)),c.version=e.VERSION,c.require=function(){var t=o(arguments),e=t[0],i=t[1];i&&n(r,e,function(t){a(r,t,function(t){i.apply(this,t)},c)})},c.build=function(){var e=o(arguments),a=e[0],s=e[1];s&&n(r,a,function(e){t.mapAsync(e,function(t,e){i(r,t,e,c)},function(t){s.apply(this,t)})})},c.getCurrentScript=e.getCurrentScript,c}var c=u({cache:!0,debug:!1,baseURI:e.getBaseURI()});if(r.browser){var f=e.getCurrentScript();if(f){f.parentNode.removeChild(f);var p=f.getAttribute("data-main"),l=f.innerText||"";p?c.require(p,Function("main",l)):l&&Function(l)()}}return c}(n,a,i,f,l,p);"object"==typeof this.process&&"string"==typeof this.process.version&&"object"==typeof module&&"object"==typeof module.exports?module.exports=h:"function"==typeof t.krang&&t.define(h)||(t.krang=h)})(function(){return this}.call(null));