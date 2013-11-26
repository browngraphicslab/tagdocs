console.log("LADS = " + LADS);

LADS.Util.makeNamespace("LADS.Util.Splitscreen");

LADS.Util.Splitscreen = (function () {
    "use strict";
    var on = false,
            viewerL = null,
            viewerR = null;

    return {
        init: init,
        exit: exitSplitscreen,
        on: isOn, // That's a getter function btw
        setOn: setOn,
        setViewers: setViewers,
    };

    // Getter for splitscreen state
    function isOn() {
        return on;
    }

    // Setter, ideally shouldn't be used but necessary at the moment
    function setOn(state) {
        on = state;
    }

    //Setter for viewers
    function setViewers(root, zoomimage) {
        if (root.data('split') === "L") {
            viewerL = zoomimage.viewer;
        }
        if (root.data('split') === 'R') {
            viewerR = zoomimage.viewer;
        }
    }

 
    /**
     * Starts splitscreen
     * @param rootL     DOM root element (as JQuery obj) to go in left screen
     * @param rootR     DOM root element (as JQuery obj) to go in right screen
     */
    function init(rootL, rootR) {
        on = true;

        //Initialize meta-containers
        var Lscreen = $(document.createElement('div')),
            Rscreen = $(document.createElement('div')),
            splitbar = $(document.createElement('div')),
            spliticon = $(document.createElement('img'));
        
        // left screen
        Lscreen.attr('id', 'metascreen-L');
        Lscreen.append(rootL);
        Lscreen.css({
            'position': 'absolute',
            'left': '0%',
            'top': '0%',
            'width': '48.5%', //49
            'height': '100%',
            'z-index': '999',
            'overflow': 'hidden',
        });

        // right screen
        Rscreen.attr('id', 'metascreen-R');
        Rscreen.append(rootR);
        Rscreen.css({
            'position': 'absolute',
            'left': '51%',
            'top': '0%',
            'width': '48.5%', //49
            'height': '100%',
            'z-index': '998', //Rscreen should be lower than Lscreen so left-transitions can work
            'overflow': 'hidden',
        });

        // center divider
        splitbar.attr('id', 'splitbar');
        splitbar.css({
            'position': 'absolute',
            'left': '49%',
            'top': '0%',
            'width': '2.5%', //2
            'height': '100%',
            'z-index': '1000',
            'background-color': '#191915',
        });
        spliticon.attr('src', 'images/icons/Ellipsis_w.svg');
        spliticon.css({
            position: 'absolute',
            top: '45%',
            left: '35%',
            width: 'auto',
            height: '5.25%',
            '-ms-user-select': 'none', //Disable dragging I hope
        });
        splitbar.append(spliticon);

        //Add buttons
        var exitL = makeExitButton('R'),
            exitR = makeExitButton('L');
        exitL.css({ left: '-150%', });
        exitR.css({ right: '-150%', });
        splitbar.append(exitL).append(exitR);

        $('body').append(Lscreen).append(splitbar).append(Rscreen);

        splitbar.mousedown(splitbarOnClick);
        spliticon.mousedown(splitbarOnClick);
        $('img').on('dragstart', function (ev) { ev.preventDefault(); });

        /**
         * Helper function for splitbar sliding and resizing
         * Note: inner function in init()
         * @param ev    Mouse event
         */
        function splitbarOnClick(ev) {
            ev.preventDefault(); //Gets rid of dragging
            var removeedge = 10,
                body = $('body');
            body.data('mouseOffset', ev.pageX); // Used for sliding bar relative to where mouse first clicks it
            if (viewerL) {
                $(viewerL.container).css({ 'width': $(viewerL.container).width() + 'px', 'height': '100%' });
            }
            if (viewerR) {
                $(viewerR.container).css({ 'width': $(viewerR.container).width() + 'px', 'height': '100%' });
            }

            var debounce = $.debounce(5, function () {

                if (viewerL) {
                    $(viewerL.container).css({ 'width': '100%', 'height': '100%' });
                    viewerL.scheduleUpdate();
                    $(viewerL.container).css({ 'width': $(viewerL.container).width() + 'px', 'height': '100%' });
                }
                if (viewerR) {
                    $(viewerR.container).css({ 'width': '100%', 'height': '100%' });
                    viewerR.scheduleUpdate();
                    $(viewerR.container).css({ 'width': $(viewerR.container).width() + 'px', 'height': '100%' });
                }
            });

            body.on('mousemove.splitbar', function (ev) {
                debounce();
                var mousepercent = (ev.pageX / window.innerWidth) * 100,
                    diff = body.data('mouseOffset') - ev.pageX,
                    left = ((splitbar.offset().left - diff) / window.innerWidth) * 100,
                    leftper = left + '%',
                    newleft = left + 2,
                    newleftper = newleft + '%',
                    newleftwidth = (100 - newleft) + '%';

                // Update offset only when the mouse is on the bar
                if (mousepercent > removeedge && mousepercent < (100 - removeedge - 2)) {
                    body.data('mouseOffset', ev.pageX);
                }
                if (left > removeedge && left < (100 - removeedge - 2)) { // In move area
                    splitbar.css({ left: leftper, });
                    Lscreen.css({ width: leftper, });
                    Rscreen.css({ left: newleftper, width: newleftwidth, });
                    splitbar.css({ 'background-color': '#191915' });
                    exhibitionFitTexting();
                    fixLayouts();
                } else { // Moved into exit area
                    splitbar.css({ 'background-color': '#7E746E' }); // Indicate drag will exit
                    // Place splitbar right on the edge, don't let it move past
                    if (left <= removeedge) { // left
                        splitbar.css({ left: removeedge + '%', });
                        Lscreen.css({ width: removeedge + '%', });
                        Rscreen.css({ left: (removeedge + 2) + '%', width: (100 - removeedge - 2) + '%', });
                       
                    } else { // right
                        var rightedge = 100 - removeedge - 2;
                        splitbar.css({ left: rightedge + '%', });
                        Lscreen.css({ width: rightedge + '%', });
                        Rscreen.css({ left: (rightedge + 2) + '%', width: (100 - rightedge - 2) + '%', });

                    }
                }
            });

            // closing splitscreen with drag-to-edge
            $('body').on('mouseup.splitbar', function (ev) {
                var left = (ev.pageX / window.innerWidth) * 100;
                body.off('mousemove.splitbar');
                body.off('mouseup.splitbar');
                if (left >= (100 - removeedge - 2)) {
                    exitSplitscreen('L');
                } else if (left <= removeedge) {
                    exitSplitscreen('R');
                }

                if (viewerL) {
                    $(viewerL.container).css({ 'width': '100%', 'height': '100%' });
                }
                if (viewerR) {
                    $(viewerR.container).css({ 'width': '100%', 'height': '100%' });
                }
            });
        }

        /**
         * Helper function for making exit buttons
         * Inner function of init()
         * @param side  The side the button is going to go on
         */
        function makeExitButton(side) {
            var exit = $(document.createElement('img'));
            exit.attr('src', 'images/icons/x.png');
            exit.css({
                'position': 'absolute',
                'top': '94%',
                'width': '115%',
                'height': 'auto',
            });
            exit.click(function () {
                exitSplitscreen(side);
            });
            return exit;
        }
    }

    /**
     * Exits splitscreen, making the specified side fullscreen and removing the other
     * @param newside   The side to be made fullscreen, either 'R' or 'L'
     */
    function exitSplitscreen(newside) {
        var oldside,
            pickedScreen = $('#metascreen-' + newside).detach(),
            root = pickedScreen.children('.root'); //only child should be root

        on = false;

        // Remove all unneeded metacontainers and contents
        if (newside === 'L') {
            $('#metascreen-R').remove();

            if (viewerL) {
                $(viewerL.container).css({ 'width': '100%', 'height': '100%' });
                viewerL.scheduleUpdate();
            }
            viewerR = null;

        } else {
            $('#metascreen-L').remove();

            if (viewerR) {
                $(viewerR.container).css({ 'width': '100%', 'height': '100%' });
                viewerR.scheduleUpdate();
            }
            viewerL = null;

        }
        $('#splitbar').remove();

        $('body').append(root);

        fixLayoutsOnExit();

        if (viewerL) {
            viewerL.scheduleUpdate();
        }
        if (viewerR) {
            viewerR.scheduleUpdate();
        }
        viewerL = null;
        viewerR = null;

        /**
         * All the layout specific edits that need to be made upon exit
         * Theoretically, all of this should get wrapped into layout classes
         * but not sure the class pattern used allows for it
         */
        function fixLayoutsOnExit() {
            // Layout specific edits
            if (root.hasClass('artmode')) { // Fix sidebar, toggler, and splitscreen button
                var sideBar = root.find('.sideBar'),
                    toggler = root.find('.toggler'),
                    togglerImage = root.find('.togglerImage'),
                    splitscreen = root.find('.splitscreen-text'),
                    splitscreenIcon = root.find('.splitscreen-icon'),
                    locationHistoryDiv = root.find('.locationHistoryDiv'),
                    locationHistoryPanel = root.find('.locationHistoryPanel'),
                    locationHistoryToggle = root.find('.locationHistoryToggle'),
                    locationHistoryToggleIcon = root.find('.locationHistoryToggleIcon'),
                    locationHistoryText = root.find('.locationHistoryContainer').find('img'),
                    locationHistoryIcon = root.find('.locationHistoryContainer').find('div'),
                    lhmapsuffix = (newside === 'R') ? 'R' : '',
                    lhmap = root.find('.lpMapDiv'),
                    sidebarsize = window.innerWidth*0.2,
                    locsize = window.innerWidth*0.8;

                root.data('split', 'L');

                sideBar.css({ left: '0px', });
                toggler.css({
                    'position': 'absolute',
                    'left': 'auto',
                    'right': '-12%',
                    borderTopRightRadius: "10px",
                    borderBottomRightRadius: "10px",
                    borderTopLeftRadius: "0px",
                    borderBottomLeftRadius: "0px",
                });
                togglerImage.attr("src", 'images/icons/Left.png');
                splitscreen.css({ 'color': 'white' });
                splitscreen.text('Split Screen');
                splitscreenIcon.attr('src', 'images/icons/SplitW.svg');
                //locationHistoryDiv.css({ width: locsize + 'px', left: sidebarsize+'px' });
                //locationHistoryPanel.css({ left: '0px' });
                locationHistoryToggle.css({
                    left: '87.5%',
                    'border-bottom-right-radius': '10px',
                    'border-top-right-radius': '10px'
                });
                $(locationHistoryToggleIcon).attr('src', 'images/icons/Left.png');
                locationHistoryText.css("opacity", "1.0"); // reset location history opacity to 1.0
                locationHistoryIcon.css("opacity", "1.0");
                lhmap.attr('id', 'lpMapDiv');
            } else if (root.hasClass('catalog')) {
                $('#searchFilter').show();
                $('#catalog-back-button').css({ 'display': 'block' });
                var heatmapDiv = $('.heatmapDiv');
                heatmapDiv.show();
                $('.heatmapDivContainer').css({
                    'height': '100%',
                });
                heatmapDiv.css({
                    width: '0px',
                    height: '0xpx',
                });
                heatmapDiv.animate({
                    height: "80%",
                    width: "90%",
                });
                $('.expandarrowdiv').show();
            } else if (root.hasClass('exhibition')) { // Restore defaults to exhibition
                root.find('.leftbar-header').css({
                    height: '5%',
                });
                root.find('.exhibition-label').css({
                    width: '50%',
                });
                root.find('.videos-label').css({
                    width: '50%',
                });
                root.find('.selectExhibition').css({
                    'font-size': '1.5em',
                    'letter-spacing': 'inherit',
                });
                root.find('.exhibition-title').css({
                    'font-size': '5.7em',
                    'letter-spacing': 'inherit',
                });
                root.find('.exhibition-subtitle-1').css({
                    'font-size': '3em',
                    'letter-spacing': 'inherit',
                });
                root.find('.exhibition-subtitle-2').css({
                    'font-size': '2em',
                    'letter-spacing': 'inherit',
                });
            }

            exhibitionFitTexting();
        }
    }

    /**
     * More layout specific fixes
     * Exhibition fit-texting, called on exit and splitbar move
     */
    function exhibitionFitTexting() {
        $('.exhibition-label').fitText(0.5, { maxFontSize: '32px', });
        $('.videos-label').fitText(0.5, { maxFontSize: '32px' });
        $('.exhibition-selection').fitText(1.5);
        $('.exhibition-title').fitText(1);
        //$('.exhibition-subtitle-1').fitText(2);
        //$('.exhibition-subtitle-2').fitText(2.5);
        $('.description-text').fitText(4, { 'minFontSize': '12px' });
        //hackish fix for the fonts that aren't resizing (--libbyzorn)
        var descFont = parseFloat($('.description-text').css('font-size'));
        $('.select-text').css({ 'font-size': (descFont) + 'px' });
        //now, to fix the labels in the leftbarheader
        var exTitleFont = parseFloat($('.exhibition-selection').css('font-size'));
        $('#exhibition-label').css({'font-size': (1.35)*(exTitleFont) + 'px'}); //1.35 is the scale factor to make the label proportionally larger than the description text
        $('#tours-label').css({ 'font-size': (1.35) * (exTitleFont) + 'px' });
        //this fine tunes the commented-out code above, which was off by a little bit scale-wise
        $('.exhibition-subtitle-1').css({ 'font-size': (1.53) * (exTitleFont) + 'px' }); //1.53 is the scale factor, as above (hackish, I know)
        $('.exhibition-subtitle-2').css({ 'font-size': (1.22) * (exTitleFont) + 'px' }); //1.22 is the scale factor
    }

    function fixLayouts() {
        var locwidthL = $('#metascreen-L').width() - window.innerWidth * 0.2,
            locwidthR = $('#metascreen-R').width() - window.innerWidth * 0.2,
            locpaneloffset = locwidthR * 0.125;
        //$('#metascreen-L .locationHistoryDiv').css({
        //    width: locwidthL+'px'
        //});
        //$('#metascreen-R .locationHistoryDiv').css({
        //    width: locwidthR+'px'
        //});
        //$('#metascreen-R .locationHistoryPanel').css({
        //    left: locpaneloffset
        //})
    }
})();