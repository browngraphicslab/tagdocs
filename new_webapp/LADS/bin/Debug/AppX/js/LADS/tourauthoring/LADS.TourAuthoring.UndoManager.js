LADS.Util.makeNamespace('LADS.TourAuthoring.UndoManager');

/**
 * Keeps track of commands and changes issued by program and order of issuing
 * Can unexecute or execute (undo / redo) these commands
 * @param spec  not used
 * @param my    not used
 */
LADS.TourAuthoring.UndoManager = function (spec, my) {
    "use strict";

    // Private
    var that = {},
        undoStack = [],
        redoStack = [],
        initialized = false, //used to prevent undoStack from updating when timeline is opening
        undoStackSizeOriginal = 0,
        stackSize = 75;

    // Public methods

    /**
     * Log a command that has just been executed, ie. add it to the undo stack
     * @param command       LADS.TourAuthoring.Command that was just run
     */
    function logCommand(command) {
        if (initialized === true) {
            if (command.savedState === undefined)
                command.savedState = false;
            if (redoStack.length > 0) {
                redoStack = []; // when should do this?
                $('.redoButton').css({ 'opacity': '0.4' });
                console.log("clear redoStack?");
            }
            undoStack.push(command);
            $('.undoButton').css({ 'opacity': '1.0' });
            if (undoStack.length > stackSize) {
                var diff = undoStack.length - stackSize;
                undoStack.splice(0, diff);
            }

            //  console.log("SAVED STATE //TOP//FROM log command// ===" + undoStack[undoStack.length - 1].savedState);
        }
    }
    that.logCommand = logCommand;

    /**
    * function returns the savedState of the element in the top of the stack, which determines if timeline is dirty or not
    */
    function dirtyStateGetter() {
        if (undoStack.length > 0) {
            console.log("SAVED STATE //TOP//FROM DSG// ===" + undoStack[undoStack.length - 1].savedState);
            return undoStack[undoStack.length - 1].savedState;
        }
        return true;
    }
    that.dirtyStateGetter = dirtyStateGetter;


    //returns undoStack size
    function undoStackSize() {
        return undoStack.length;
    }
    that.undoStackSize = undoStackSize;


    //sets the savedState of the top element in undoStack to true, and the rest to false 
    function setPrevFalse() {
        if (undoStack.length > 0) {
            undoStack[undoStack.length - 1].savedState = true;

            for (var i = 0; i < undoStack.length - 1; i++) {
                undoStack[i].savedState = false;
                // console.log("SAVED STATE===" + undoStack[i].savedState);
            }
            // console.log("SAVED STATE //TOP// ===" + undoStack[undoStack.length - 1].savedState);
        }
    }
    that.setPrevFalse = setPrevFalse;
    //called by loadRIN method in timeline class
    function setInitialized(boolVal) {
        initialized = boolVal;
    }
    that.setInitialized = setInitialized;


    function getInitialized() {
        return initialized;
    }
    that.getInitialized = getInitialized;

    /**
     * Undo
     */
    function undo() {
        if (undoStack.length > 0) {
            var toUndo = undoStack.pop();
            toUndo.unexecute();
            redoStack.push(toUndo);
            $('.redoButton').css({ 'opacity': '1.0' });
            if (undoStack.length === 0)
                $('.undoButton').css({ 'opacity': '0.4' });
        }
        else $('.undoButton').css({ 'opacity': '0.4' });
    }
    that.undo = undo;

    /**
     * Redo
     */
    function redo() {
        if (redoStack.length > 0) {
            var toRedo = redoStack.pop();
            toRedo.execute();
            undoStack.push(toRedo);
            $('.undoButton').css({ 'opacity': '1.0' });
            if (redoStack.length === 0)
                $('.redoButton').css({ 'opacity': '0.4' });
        }
        else $('.redoButton').css({ 'opacity': '0.4' });
    }
    that.redo = redo;

    /**
     * Clears undo / redo stack
     * Called on save or after loading
     */
    function clear() {
        undoStack = [];
        redoStack = [];
    }
    that.clear = clear;

    // greyed out the undo/redo buttons when there is no possible action
    function greyOutBtn() {
        $('.undoButton').css({ 'opacity': '1.0' });
        $('.redoButton').css({ 'opacity': '1.0' });
        if (undoStack.length < 1) {
            $('.undoButton').css({ 'opacity': '0.4' });
        }
        if (redoStack.length < 1) {
            $('.redoButton').css({ 'opacity': '0.4' });
        }
    }
    that.greyOutBtn = greyOutBtn;

    /**
     * Utility for combining together multiple commands
     * (Originally used for tying auto-creation of displays together with track creation)
     * @param n     Number of commands to tie together
     */
    function combineLast(n) {
        var command, i;
        n = n || 2;
        command = {
            execute: function () {
                for (i = 0; i < n; i++) {
                    redo();
                }
            },
            unexecute: function () {
                for (i = 0; i < n; i++) {
                    undo();
                }
            }
        };
        logCommand(command);
    }
    that.combineLast = combineLast;

    return that;
};