LADS.Util.makeNamespace("LADS.Layout.MetroSplitscreenMessage");

/*
    BM - Using this for more than internet failure, should
    be renamed/refactored in the future.
*/
LADS.Layout.MetroSplitscreenMessage = function () {
    "use strict";

    this.getRoot = function () {
        return root;
    };

    var root = $(document.createElement('div'));
    root.css({
        'position': 'fixed',
        'left': '0px',
        'top': '0px',
        'width': '100%',
        'height': '100%',
        'background-color': 'rgb(50,75,107)',
        'color': 'white',
        'z-index': '1000000000',
    });

    var tag = $(document.createElement('label'));
    tag.css({
        'font-size': '380%',
        'position': 'relative',
        'display': 'block',
        'text-align': 'center',
        'top': '25%',
    });
    tag.text('TAG');

    var info = $(document.createElement('label'));
    info.css({
        'font-size': '120%',
        'position': 'relative',
        'top': '45%',
        'display': 'block',
        'text-align': 'center',
    });
    info.text('TAG must be run in full screen mode');

    root.append(tag).append('<br>').append(info);
};