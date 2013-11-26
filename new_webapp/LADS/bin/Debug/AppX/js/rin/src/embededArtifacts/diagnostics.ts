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
module rin.diagnostics {

    export function newDiagnosticsModule(moduleName: string) {
        var doLog = !!(console && console.log);
        return {
            log: function (...content: string[]) {
                //document.writeln.apply(document, content);
                doLog && console.log.apply(console, content);
            },
            assert: function assert(cond: any, strCond: string): void {
                if (!cond) {
                    throw { name: "assertionFailureException", message: "MODULE: " + moduleName + " ASSERTION: " + strCond };
                }
            },

            throwDuplicateException: function (msg: string) {
                throw { name: "duplicateObjectException", message: "MODULE: " + moduleName + " ASSERTION: " + msg };
            }

        };
    }

}