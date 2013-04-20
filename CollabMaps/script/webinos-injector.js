/*
 * Code contributed to the webinos project.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * (C) Copyright 2012, TNO
 */

/* script to inject webinos.js and loads up the needed webinos services as on Android
 * loading of the scripts is delayed.
 */

'use strict';

var WebinosInjector = WebinosInjector || (function () {
    var head = document.getElementsByTagName("head")[0];
    
    var addScript = function(src, callback) {
        var oScript = document.createElement('script');
        oScript.type = 'text/javascript';
        oScript.src = src;
        // most browsers
        oScript.onload = callback;

        // IE 6 & 7
        oScript.onreadystatechange = function() {
            if (this.readyState == 'complete') {
                callback();
            }
        }

        head.appendChild(oScript);
    }
    
    return {
		inject : function (callback) {
            if(window.WebSocket || window.MozWebSocket) {
                addScript("http://localhost:8080/webinos.js", callback);
            } else {
                if(typeof WebinosSocket == 'undefined') {
                    setTimeout(function() {
                        inject(callback);
                    }, 1);
                } else {
                    addScript("http://localhost:8080/webinos.js", callback);
                }
            }
		},
		onServiceHasLoaded : function (service, callback) {
		    if (!service.base) {
		        setTimeout(function() {
		            waitForService(service, callback);
		        }, 1);
		    } else {
		        callback(service);
		    }
		}
	}
});

var webinosInjector = webinosInjector || new WebinosInjector();
