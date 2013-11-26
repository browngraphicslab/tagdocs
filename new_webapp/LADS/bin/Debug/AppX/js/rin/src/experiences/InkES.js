/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../contracts/DiscreteKeyframeESBase.js" />
/// <reference path="../contracts/IExperienceStream.js" />
/// <reference path="../contracts/IOrchestrator.js" />
/// <reference path="../core/Common.js" />
/// <reference path="../core/EventLogger.js" />
/// <reference path="../core/PlayerConfiguration.js" />
/// <reference path="../core/ResourcesResolver.js" />
/// <reference path="../core/TaskTimer.js" />

window.rin = window.rin || {};

(function (rin) {
    // ES for hosting Ink elements clips.
    var InkES = function (orchestrator, esData) {
        InkES.parentConstructor.apply(this, arguments);
        var self = this;
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(InkES.elementHTML).firstChild;
        this._rinInkContainer = this._userInterfaceControl.getElementsByClassName("rinInkContainer")[0];
        this._rinInkController = null;
        this.loaded = false; // flip to true once ink svg is initialized
        this.prevDims = null; // store dims of linked art while ink is not onscreen
        this._esData = esData;
        this._loadTimeout = null;
        this._timeout = null;
        this._unloaded = false;
        this.link = null;
        this._playCalled = false;
        this.lastDims = {x: 0, y: 0, w: 0, h: 0};
        if (esData.data.linkToExperience) {
            this.link = esData.data.linkToExperience;
            this.embeddedItem = this.link.embedding;
        }
    };

    rin.util.extend(rin.contracts.DiscreteKeyframeESBase, InkES);

    InkES.prototypeOverrides = {
        // Load and initialize the video.
        load: function (experienceStreamId) {
            var self = this;
            if (self._unloaded) {
                return;
            }
            console.log("load called in INKES");
            //this._unloaded = false;

            //// Check if valid link and hook up events
            function findLinkedES() {
                
                // Get the linked ES instance
                var encoded_id = "";
                for (var i = 0; i < self._esData.experienceId.length; i++)
                    encoded_id += self._esData.experienceId.charCodeAt(i);
                var allESes = self._orchestrator.getESItems();
                self.linkedES = allESes.firstOrDefault(function (es) {
                    return es.id === self.link.embedding.experienceId;
                });

                if (self.linkedES && self.linkedES.experienceStream &&
                    self.linkedES.experienceStream.getState() === "ready" &&
                    self.linkedES.experienceStream.viewportChangedEvent && self.linkedES.experienceStream.raiseViewportUpdate) {
                    
                    self.linkedES.experienceStream.viewportChangedEvent.subscribe(function (newViewport) {
                        self.viewportChanged(newViewport);
                    },encoded_id);

                    self.loadInkItems();
                    self.linkedES.experienceStream.raiseViewportUpdate();
                    return;
                }
                else {
                    console.log("failed to find linkedES for " + encoded_id);
                    if (!self._unloaded) {
                        self._loadTimeout = setTimeout(findLinkedES, 1000);
                    }
                }
            }

            if (self.link.embedding.enabled) {
                findLinkedES();
            }
            else {
                self.loadInkItems();
            }
        },

        loadInkItems: function () {
            // Load all ink items here
            var self = this;
            var i;
            var DATASTRING = self.embeddedItem.element.datastring.str;

            // use the ink's title to get a unique id; title might have spaces, so encode it
            var EID = self._esData.experienceId;
            var inkNum = "";
            for (i = 0; i < EID.length; i++)
                inkNum += EID.charCodeAt(i);
            console.log("in inkES, inknum = " + inkNum);
            // the dom element to which we'll append the ink canvas container
            //var viewerElt = $("#rinplayer");
            //viewerElt = (viewerElt.length) ? viewerElt : $("#rinPlayer");
            //viewerElt.css("position", "absolute");

            // if we try to call loadInkItems too soon, use a callback to retry
            var callback = function () {
                if (self.loadInkItems) {
                    self.loadInkItems();
                }
            };

            // once we can load in to html, load it
            //if (self._rinInkContainer.parentNode.parentNode) {
			var onscreenInk = $("[ES_ID='" + EID + "']");
            if (onscreenInk[0] && onscreenInk[0].childNodes[0]) {
			//if ($("[ES_ID='" + EID + "']")[0] && $("[ES_ID='" + EID + "']")[0].childNodes[0]) {
                var iid = "inkCanv" + inkNum;
                if (self.link.embedding.enabled) {
                    // if our ink is attached:
                    if ($(self._rinInkContainer)[0].childNodes.length)
                        return;

                    // add the right ID to the ink container div, create the inkController
                    $(self._rinInkContainer).attr("id", iid);
                    //self._rinInkController = new LADS.TourAuthoring.InkAuthoring(iid, self._rinInkContainer, "inkes", null);
                    self._rinInkController = new tagInk(iid, self._rinInkContainer);
                    self._rinInkController.set_mode(-1);
                    self._rinInkController.setInitKeyframeData(self.link.embedding.initKeyframe);
                    self._rinInkController.setArtName(self.link.embedding.experienceId);
                    self._rinInkController.retrieveOrigDims();
                    self._rinInkController.setEID(EID);
                    self._rinInkController.loadInk(DATASTRING);
                }
                else {
                    // if our ink is unattached:
                    $(self._rinInkContainer).attr("id", iid);
                    //self._rinInkController = new LADS.TourAuthoring.InkAuthoring(iid, self._rinInkContainer, "inkes", null); //inkController("inkCanv" + inkNum, self._rinInkContainer);
                    self._rinInkController = new tagInk(iid, self._rinInkContainer);
                    self._rinInkController.set_mode(-1);
                    self._rinInkController.loadInk(DATASTRING);
                }
                this.loaded = true;
                self.setState(rin.contracts.experienceStreamState.ready);
            }
            else {
                if (!self._unloaded) {
                    //console.log("ABOUT TO SET TIMEOUT IN INKES");
                    this._timeout = setTimeout(callback, 50);
                }
            }
        },

        viewportChanged: function (dims) {
            // take care of panning and zooming here
            //var check_onscreen = true; // set this to 'true' to check if an ink is on screen before calling adjustViewBox (this should be how it's done, but there's a problem with fades now)
            //var container = $("[ES_ID='" + this._esData.experienceId + "']")[0];
            if (this.loaded && (this._playCalled || parseFloat(this._rinInkContainer.parentNode.style.opacity))) {
                // check if play has been called or the opacity is 1 (want to let in one more viewportChanged event when the opacity could be 0)
                this._playCalled = false;
                try {
                    this._rinInkController.adjustViewBox(dims);
                }
                catch (err) {
                    console.log("error in viewportChanged: " + err);
                }
            }
            this.prevDims = dims;
        },
        //// Play the video.
        play: function (offset, experienceStreamId) {
            // here we call adjustViewBox to position a linked ink correctly when it first comes on screen. There's an issue now if the ink starts at time 0 (maybe
            // other times, too -- test!)
            console.log("PLAY called for ink: " + this._esData.experienceId);
            this._playCalled = true;
            if (this.link.embedding.enabled) {
                if (this.prevDims) {
                    this._rinInkController.adjustViewBox(this.prevDims);
                } else {
                    var proxy = this.linkedES.experienceStream.proxy;
                    var x = parseFloat(proxy.data("x"));
                    var y = parseFloat(proxy.data("y"));
                    var w = parseFloat(proxy.data("w"));
                    var h = parseFloat(proxy.data("h"));
                    console.log("dims in inkes play: (" + x + "," + y + "," + w + "," + h + ")");
                    this._rinInkController.adjustViewBox({ x: x, y: y, width: w, height: h }, 1);
                }
            }
        },
        // Pause the video.
        pause: function (offset, experienceStreamId) {
        },
        //unload the ink es; just clear its timeout
        unload: function () {
            try {
                this._unloaded = true;
                if (this._timeout) {
                    clearTimeout(this._timeout);
                }
                if (this._loadTimeout) {
                    clearTimeout(this._loadTimeout);
                }
                console.log("UNLOADING INKES");
            } catch (e) {
                console.log("failed to clear timeout in inkES: "+e.message);
                rin.internal.debug.assert(!e);
            } // Ignore errors on unload.
        },
        // Set the base volume of the video. This will be multiplied with the keyframed volume to get the final volume.
        setVolume: function (baseVolume) {
        },
        // Mute or unmute the video.
        setIsMuted: function (value) {

        },
        _interactionControls: null
    };
    InkES.elementHTML = "<div style='height:100%;width:100%;position:relative;background:transparent'><div class='rinInkContainer inkCanv' style='pointer-events:none;height:100%;width:100%;left:0px;top:0px;position:absolute;background:transparent'></div></div>";
    rin.util.overrideProperties(InkES.prototypeOverrides, InkES.prototype);
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.InkExperienceStream", function (orchestrator, esData) { return new InkES(orchestrator, esData); });
})(rin);
