// 
// Typedefs for qunit functionality used in the tests
//

// assertion
var ok:  (condition: bool, message?: string) => void;

// Identifies a test module
var module: (name:string) => void;

// Defines a test
var test: (name:string, testFunc: ()=> void ) => void;
