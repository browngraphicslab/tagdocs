LADS.Util.makeNamespace("LADS.Util.Constants");

LADS.Util.Constants = (function (options) {
    "use strict";
    
    //StartPage

    var constants = {};

    return{
        get: getConstant,
        set: setConstant
    };

    function getConstant(name, defaultVal) {
        return constants[name] || defaultVal;
    }
    function setConstant(name, value) {
        constants[name] = value;
    }
})();