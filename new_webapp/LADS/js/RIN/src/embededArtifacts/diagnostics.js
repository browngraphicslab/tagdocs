/*!
*
* RIN Core JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright (c)  2013, Microsoft Research
* By using this source you agree to the terms and conditions detailed in the following licence:
*     http://rinjs.org/licenses/v1.0/
*
* Date: 2013-MARCH-01
*
* This file defines and implements certain common diagnostic functionality.
*
*/
var rin;
(function (rin) {
    (function (diagnostics) {
        function newDiagnosticsModule(moduleName) {
            var doLog = !!(console && console.log);
            return {
                log: function () {
                    var content = [];
                    for (var _i = 0; _i < (arguments.length - 0); _i++) {
                        content[_i] = arguments[_i + 0];
                    }
                    //document.writeln.apply(document, content);
                    doLog && console.log.apply(console, content);
                },
                assert: function assert(cond, strCond) {
                    if(!cond) {
                        throw {
                            name: "assertionFailureException",
                            message: "MODULE: " + moduleName + " ASSERTION: " + strCond
                        };
                    }
                },
                throwDuplicateException: function (msg) {
                    throw {
                        name: "duplicateObjectException",
                        message: "MODULE: " + moduleName + " ASSERTION: " + msg
                    };
                }
            };
        }
        diagnostics.newDiagnosticsModule = newDiagnosticsModule;
    })(rin.diagnostics || (rin.diagnostics = {}));
    var diagnostics = rin.diagnostics;
})(rin || (rin = {}));
//@ sourceMappingURL=diagnostics.js.map
