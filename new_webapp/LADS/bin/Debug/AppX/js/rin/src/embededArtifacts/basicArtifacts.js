window.rin = window.rin || {};
rin.embeddedArtifacts = rin.embeddedArtifacts || {}

rin.embeddedArtifacts.utils = {};
rin.embeddedArtifacts.utils.Region = function() {
    this.center = {x:0,y:0};
    this.span = {x:0,y:0};
};

// Base class for embedded artifacts to abstract common methods.
// Its not a must to inherit this class for building an EA, but make sure you implement all required methods.
rin.embeddedArtifacts.EmbeddedArtifactBase = function (dataObject, resourceResolver) {
    this.resourceResolver = resourceResolver;
    this.dataObject = dataObject;
    this.zoomRange = dataObject.zoomRange || { from: 0, to: 1 };
    this.parameterRange = dataObject.parameterRange || { from: 0, to: 1 };
    this.visual = null; // Active DOM element for the visual of this EA
    this.visualLoadHelper = null;
    this.styleLoadHelper = null;
    this.interactionRequested = new rin.contracts.Event();
    this.layoutChanged = new rin.contracts.Event();
    this.anchoredOffset = dataObject.anchoredOffset || { x: 0, y: 0 };
    this.anchorCorner = dataObject.anchorCorner || "tl";
};

// Basic properties and methods for any EA
rin.embeddedArtifacts.EmbeddedArtifactBase.prototype = {
    visualLoadComplete:function () {
        this.raiseLayoutChanged();
    },

    // Set the source for the visual of this EA, this method can be called only if the source is a Url. If not you can set the visualLoadHelper and styleLoadHelper manually.
    setVisualSource: function (visualUrl, styleUrl) {
        this.visualLoadHelper = new rin.internal.AjaxDownloadHelper(visualUrl);
        this.styleLoadHelper = new rin.internal.AjaxDownloadHelper(styleUrl);
    },

    // Method bound to the click of an EA
    onClick: function () {
        this.interactionRequested.publish({actualEA:this});
    },

    // Method to ask the EA host to redraw all EAs
    raiseLayoutChanged : function(){
        if (this.visual) {
            this.layoutChanged.publish(this);
        }
    },

    resolverMediaUrl: function(url){
        if (url) {
            return url.indexOf("http") == 0 ? url : this.resourceResolver.resolveResource(url);
        } else { return null; }
    },

    // Method to recalculate the anchoring point of an EA. In case the anchoring point never changes after it is loaded, override this method and just return the anhoring point.
    getAnchoredOffset: function () {
        var offsetX = this.visual.anchorX,
            offsetY = this.visual.anchorY,
            visualHeight = this.visual.height || this.visual.clientHeight,
            visualWidth = this.visual.width || this.visual.clientWidth;

        if (offsetX <= 1 && offsetX >= -1) this.anchoredOffset.x = offsetX * visualWidth; // Anchor is specified in percentage if its between -1 and 1
        else this.anchoredOffset.x = offsetX;
        if (offsetY <= 1 && offsetY >= -1) this.anchoredOffset.y = offsetY * visualHeight;
        else this.anchoredOffset.y = offsetY;

        // Update anchor based on anchoring corner. 'tl' is default.
        if (this.anchorCorner === "bl")
            this.anchoredOffset.y += visualHeight;

        if (this.anchorCorner === "tr")
            this.anchoredOffset.x += visualWidth;

        if (this.anchorCorner === "br") {
            this.anchoredOffset.y += visualHeight;
            this.anchoredOffset.x += visualWidth;
        }

        return this.anchoredOffset;
    },

    setVolume: function (value) {
    },

    onPlayerStateChanged: function (state) {
        if (state.currentState == rin.contracts.playerState.pausedForExplore)
            this.isInPlayMode = false;
        else if (state.currentState == rin.contracts.playerState.playing)
            this.isInPlayMode = true;
    },
    isInPlayMode : null
};

// HotSpot EA
rin.embeddedArtifacts.HotSpot = function (dataObject, resourceResolver) {
    rin.embeddedArtifacts.HotSpot.parentConstructor.call(this, dataObject, resourceResolver);
    this.setVisualSource("embeddedArtifacts/HotSpot.html", "embeddedArtifacts/HotSpot.css");
    this.thumbnailUrl = this.resolverMediaUrl(dataObject.thumbnailUrl);
    this.text = dataObject.text || null;
}

rin.embeddedArtifacts.HotSpot.prototypeOverrides = {};

// Audio EA
rin.embeddedArtifacts.Audio = function (dataObject, resourceResolver) {
    rin.embeddedArtifacts.Audio.parentConstructor.call(this, dataObject, resourceResolver);
    var self = this;
    this.setVisualSource("embeddedArtifacts/Audio.html", "embeddedArtifacts/Audio.css");
    this.audioControl = document.createElement("audio");
    this.audioControl.preload = "auto";
    this.audioControl.src = this.resolverMediaUrl(dataObject.sourceFile);
    this.isEnvironmentalAudio = dataObject.isEnvironmental;

    // Constantly check if the audio is ready and update the state as necessary.
    var READY_STATE = 4,
        TIME_OUT = 500,
        readyStateCheckTimeout,
        readyStateCheck = function () {
            if (self.audioControl.readyState === READY_STATE) {
                clearTimeout(readyStateCheckTimeout);
                self.onLoadComplete();
            }
            else {
                readyStateCheckTimeout = setTimeout(readyStateCheck, TIME_OUT);
            }
        };
    this.audioControl.onerror = function () {
        if (readyStateCheckTimeout)
            clearTimeout(readyStateCheckTimeout);
    }
    readyStateCheck();
}

rin.embeddedArtifacts.Audio.prototypeOverrides = {
    // Method bound to the click of an EA
    onClick: function () {
        if (!this.isEnvironmentalAudio) {
            if (this.audioControl.paused)
                this.audioControl.play();
            else
                this.audioControl.pause();
        }
    },

    onLoadComplete: function () {
        if (this.isEnvironmentalAudio) {
            this.audioControl.loop = true;
            this.audioControl.autoplay = true;
            this.audioControl.controls = false;
        }
    },

    setVolume: function (value) {
        if (this.isEnvironmentalAudio) {
            //Check for playing and start if not
            if (value <= this.MIN_VOL) {
                this.audioControl.volume = 0;
                if (!this.audioControl.paused) {
                    this.audioControl.pause();
                }
            }
            else {
                this.audioControl.volume = Math.min(value, 1); //Max it to 1
                if (this.audioControl.paused) {
                    this.audioControl.play();
                }
            }
        }
    },

    MIN_VOL: 0.0001
};

// Video EA
rin.embeddedArtifacts.Video = function (dataObject, resourceResolver) {
    rin.embeddedArtifacts.Video.parentConstructor.call(this, dataObject, resourceResolver);
    this.setVisualSource("embeddedArtifacts/Video.html", "embeddedArtifacts/Video.css");
}
rin.embeddedArtifacts.Video.prototypeOverrides = {};

// Text with arrow EA
rin.embeddedArtifacts.TextWithArrow = function (dataObject) {
    rin.embeddedArtifacts.TextWithArrow.parentConstructor.call(this, dataObject);
    var self = this;
    this.setVisualSource("embeddedArtifacts/TextWithArrow.html", "embeddedArtifacts/TextWithArrow.css");

    this.text = dataObject.text || null;
    this.arrowLength = dataObject.arrowLength || 0;
    this.arrowDirection = dataObject.arrowDirection || null;
}

rin.embeddedArtifacts.TextWithArrow.prototypeOverrides = {
    // Update the anchoring details depending on the arrow length and arrow direction
    // TODO: This method deals with a lot of visual related stuff. Ideally this has to abstracted out to allow reusing the EA with other visuals.
    // This method helps avoiding lots of bindings in the UI. Bindings makes the app slower.
    updateLayout: function () {
        $(".rin_TWL_Arrow", self.visual).hide(); // Hide all arrows
        var visibleLineContainerClass;

        var box = $(".rin_TextWithLineContentContainer", this.visual);
        if (this.dataObject.backgroundColor)
            box.css("backgroundColor",this.dataObject.backgroundColor)
        if (this.dataObject.defaultInteractionBehavior)
            box.addClass("rin_TextWithLineWithLink");

        // set anchor based on the length and direction
        switch (self.arrowDirection) {
            case "tlu":
                self.visual.anchorX = -self.arrowLength;
                self.visual.anchorY = -self.arrowLength;
                self.anchorCorner = "tl";
                visibleLineContainerClass = "rin_TWL_TopLeft_Up";
                break;
            case "tld":
                self.visual.anchorX = -self.arrowLength;
                self.visual.anchorY = self.arrowLength;
                self.anchorCorner = "tl";
                visibleLineContainerClass = "rin_TWL_TopLeft_Down";
                break;
            case "tlh":
                self.visual.anchorX = -self.arrowLength;
                self.visual.anchorY = 0;
                self.anchorCorner = "tl";
                visibleLineContainerClass = "rin_TWL_TopLeft_Horizontal";
                break;
            case "tlv":
                self.visual.anchorX = 0;
                self.visual.anchorY = -self.arrowLength;
                self.anchorCorner = "tl";
                visibleLineContainerClass = "rin_TWL_TopLeft_Vertical";
                break;

            case "blu":
                self.visual.anchorX = -self.arrowLength;
                self.visual.anchorY = -self.arrowLength;
                self.anchorCorner = "bl";
                visibleLineContainerClass = "rin_TWL_BottomLeft_Up";
                break;
            case "bld":
                self.visual.anchorX = -self.arrowLength;
                self.visual.anchorY = self.arrowLength;
                self.anchorCorner = "bl";
                visibleLineContainerClass = "rin_TWL_BottomLeft_Down";
                break;
            case "blh":
                self.visual.anchorX = -self.arrowLength;
                self.visual.anchorY = 0;
                self.anchorCorner = "bl";
                visibleLineContainerClass = "rin_TWL_BottomLeft_Horizontal";
                break;
            case "blv":
                self.visual.anchorX = 0;
                self.visual.anchorY = self.arrowLength;
                self.anchorCorner = "bl";
                visibleLineContainerClass = "rin_TWL_BottomLeft_Vertical";
                break;

            case "bru":
                self.visual.anchorX = self.arrowLength;
                self.visual.anchorY = self.arrowLength;
                self.anchorCorner = "br";
                visibleLineContainerClass = "rin_TWL_BottomRight_Up";
                break;
            case "brd":
                self.visual.anchorX = self.arrowLength;
                self.visual.anchorY = self.arrowLength;
                self.anchorCorner = "br";
                visibleLineContainerClass = "rin_TWL_BottomRight_Down";
                break;
            case "brh":
                self.visual.anchorX = self.arrowLength;
                self.visual.anchorY = 0;
                self.anchorCorner = "br";
                visibleLineContainerClass = "rin_TWL_BottomRight_Horizontal";
                break;
            case "brv":
                self.visual.anchorX = 0;
                self.visual.anchorY = self.arrowLength;
                self.anchorCorner = "br";
                visibleLineContainerClass = "rin_TWL_BottomRight_Vertical";
                break;

            case "tru":
                self.visual.anchorX = self.arrowLength;
                self.visual.anchorY = -self.arrowLength;
                self.anchorCorner = "tr";
                visibleLineContainerClass = "rin_TWL_TopRight_Up";
                break;
            case "trd":
                self.visual.anchorX = self.arrowLength;
                self.visual.anchorY = self.arrowLength;
                self.anchorCorner = "tr";
                visibleLineContainerClass = "rin_TWL_TopRight_Down";
                break;
            case "trh":
                self.visual.anchorX = self.arrowLength;
                self.visual.anchorY = 0;
                self.anchorCorner = "tr";
                visibleLineContainerClass = "rin_TWL_TopRight_horizontal";
                break;
            case "trv":
                self.visual.anchorX = 0;
                self.visual.anchorY = self.arrowLength;
                self.anchorCorner = "tr";
                visibleLineContainerClass = "rin_TWL_TopRight_Vertical";
                break;
        }

        // Set height and width of the line container div
        var visibleLineContainer = $("." + visibleLineContainerClass);
        visibleLineContainer.show();
        visibleLineContainer.attr("width", self.arrowLength + "px");
        visibleLineContainer.attr("height", self.arrowLength + "px");

        // Update the translation in CSS so that the lines are correctly positioned even after the length is changed.
        if (parseFloat(visibleLineContainer.css("top")) > 0) visibleLineContainer.css("top", self.arrowLength + "px");
        else if (parseFloat(visibleLineContainer.css("top")) < 0) visibleLineContainer.css("top", -self.arrowLength + "px");
        if (parseFloat(visibleLineContainer.css("left")) > 0) visibleLineContainer.css("left", self.arrowLength + "px");
        else if (parseFloat(visibleLineContainer.css("left")) < 0) visibleLineContainer.css("left", -self.arrowLength + "px");
        if (parseFloat(visibleLineContainer.css("bottom")) > 0) visibleLineContainer.css("bottom", self.arrowLength + "px");
        else if (parseFloat(visibleLineContainer.css("bottom")) < 0) visibleLineContainer.css("bottom", -self.arrowLength + "px");
        if (parseFloat(visibleLineContainer.css("right")) > 0) visibleLineContainer.css("right", self.arrowLength + "px");
        else if (parseFloat(visibleLineContainer.css("right")) < 0) visibleLineContainer.css("right", -self.arrowLength + "px");

        // Update the line SVG height and width
        var lineSvg = $(".rin_TWL_Line", visibleLineContainer);
        var svgContainer = $("svg", visibleLineContainer);
        svgContainer.attr("width", self.arrowLength + "px");
        svgContainer.attr("height", self.arrowLength + "px");

        // Update the line itself according to the new length.
        if (lineSvg.attr("x1") > 0) lineSvg.attr("x1", self.arrowLength);
        else if (lineSvg.attr("x1") < 0) lineSvg.attr("x1", -self.arrowLength);
        if (lineSvg.attr("x2") > 0) lineSvg.attr("x2", self.arrowLength);
        else if (lineSvg.attr("x2") < 0) lineSvg.attr("x2", -self.arrowLength);
        if (lineSvg.attr("y1") > 0) lineSvg.attr("y1", self.arrowLength);
        else if (lineSvg.attr("y1") < 0) lineSvg.attr("y1", -self.arrowLength);
        if (lineSvg.attr("y2") > 0) lineSvg.attr("y2", self.arrowLength);
        else if (lineSvg.attr("y2") < 0) lineSvg.attr("y2", -self.arrowLength);
    },

    // Update anchor based of arrow direction and length
    visualLoadComplete: function () {
        this.updateLayout();
        this.raiseLayoutChanged();
    }
}

// Label EA
rin.embeddedArtifacts.Label = function (dataObject, resourceResolver) {
    rin.embeddedArtifacts.Label.parentConstructor.call(this, dataObject, resourceResolver);
    this.setVisualSource("embeddedArtifacts/Label.html", "embeddedArtifacts/Label.css");
    this.text = dataObject.text || null;
    this.linkType = dataObject.linkType;
}
rin.embeddedArtifacts.Label.prototypeOverrides = {
    visualLoadComplete: function () {
        if (this.dataObject.defaultInteractionBehavior) {
            $visual = $(this.visual);
            switch (this.dataObject.defaultInteractionBehavior) {
                case "rin.interactionBehaviors.seekToHT":
                    $visual.addClass("rin_LabelArtifactLink");
                    break;
                case "rin.interactionBehaviors.popup":
                    $visual.addClass("rin_LabelArtifactPopup");
                    break;
            }
            if (this.dataObject.linkType) {
                $visual.addClass('rin_Label_' + this.dataObject.linkType);
                $visual.addClass('rin_Label_Interactive');
            }
        }
    },
    getAnchoredOffset: function () {
        if (this.dataObject.anchoredOffset) // Consider if offset is set explicitly.
            return { x: this.anchoredOffset.x * this.visual.clientWidth, y: this.anchoredOffset.y * this.visual.clientHeight };
        else if (this.dataObject.linkType == "peakLabel") // Use bottom center for peak labels
            return { x: 0.5 * this.visual.clientWidth, y: 1.0 * this.visual.clientHeight };
        else // Use default
            return this.anchoredOffset;
    }
};

rin.util.extend(rin.embeddedArtifacts.EmbeddedArtifactBase,rin.embeddedArtifacts.HotSpot);
rin.util.overrideProperties(rin.embeddedArtifacts.HotSpot.prototypeOverrides, rin.embeddedArtifacts.HotSpot.prototype);

rin.util.extend(rin.embeddedArtifacts.EmbeddedArtifactBase, rin.embeddedArtifacts.Audio);
rin.util.overrideProperties(rin.embeddedArtifacts.Audio.prototypeOverrides, rin.embeddedArtifacts.Audio.prototype);

rin.util.extend(rin.embeddedArtifacts.EmbeddedArtifactBase, rin.embeddedArtifacts.Video);
rin.util.overrideProperties(rin.embeddedArtifacts.Video.prototypeOverrides, rin.embeddedArtifacts.Video.prototype);

rin.util.extend(rin.embeddedArtifacts.EmbeddedArtifactBase, rin.embeddedArtifacts.Label);
rin.util.overrideProperties(rin.embeddedArtifacts.Label.prototypeOverrides, rin.embeddedArtifacts.Label.prototype);

rin.util.extend(rin.embeddedArtifacts.EmbeddedArtifactBase, rin.embeddedArtifacts.TextWithArrow);
rin.util.overrideProperties(rin.embeddedArtifacts.TextWithArrow.prototypeOverrides, rin.embeddedArtifacts.TextWithArrow.prototype);
