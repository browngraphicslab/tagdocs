window.rin = window.rin || {};
rin.embeddedArtifacts = rin.embeddedArtifacts || {}

// Module to help with loading artifact visuals
rin.embeddedArtifacts.artifactManager = (function () {
    var loadedStyles = {}; // dictionary to store styles which are already loaded

    // Inject a given css style to the current document
    var injectStyle = function (styleString) {
        var head_node = document.getElementsByTagName('head')[0];
        var style_tag = document.createElement('style');
        style_tag.innerHTML = styleString;
        style_tag.setAttribute('rel', 'stylesheet');
        style_tag.setAttribute('type', 'text/css');
        head_node.appendChild(style_tag);
    };

    // Load the visual for ea. This will take care of downloading the visual and caching
    var loadVisual = function (ea, resourceResolver, onLoadCompleteCallback) {
        // Process the visual once its downloaded
        var visualDownloaded = function (visual) {
            visual.style.position = "absolute";

            if (visual.attributes["height"])
                visual.height = parseFloat(visual.attributes["height"].value);
            else
                visual.height = 0;

            if (visual.attributes["height"])
                visual.width = parseFloat(visual.attributes["width"].value);
            else
                visual.width = 0;

            if (visual.attributes["anchorX"])
                visual.anchorX = parseFloat(visual.attributes["anchorX"].value);
            else
                visual.anchorX = 0;

            if (visual.attributes["anchorY"])
                visual.anchorY = parseFloat(visual.attributes["anchorY"].value);
            else
                visual.anchorY = 0;

            if (typeof (onLoadCompleteCallback) === "function")
                onLoadCompleteCallback(visual);
        };

        // Download the visual and build the DOM element
        var styleLoadComplete = function () {
            var containerStub = document.createElement("div");
            var visualString = ea.visualLoadHelper.getContent(function (visualString) {
                containerStub.innerHTML = visualString;
                visualDownloaded(containerStub.firstChild, ea);
            }, resourceResolver);
        };

        // Load styles if mentioned and then go on to visual load
        var styleSource = ea.styleLoadHelper.getSource();
        if (styleSource) {
            if (!loadedStyles.hasOwnProperty(styleSource)) {
                ea.styleLoadHelper.getContent(function (styleString) {
                    injectStyle(styleString);
                    styleLoadComplete();
                }, resourceResolver);
            }
            else styleLoadComplete();
        }
    }

    // Public members
    return {
        loadArtifactVisual: loadVisual
    };
})();

// EA Host takes care of rendering an EA on screen, it also loads the visual for an ea, does caching etc..
// This will inject a new div/canvas to the parent Element specified, but will be transparent.
rin.embeddedArtifacts.ArtifactHost = function (parentElement, orchestrator) {
    var self = this;
    var displayState = {visible:"block",hidden:"none"};
    var currentEAList = {}; // list of all EA's currently in the host
    var resourceResolver = orchestrator.getResourceResolver();
    var scaleTransformCSSProperty = "transform";
    if (!parentElement) return;

    // Inject a canvas for hosting the EAs
    var canvas = document.createElement("div");
    canvas.setAttribute("class","rinDefault2DHost");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    //canvas.style.position = "absolute"; // This is commented out as this breaks mouse interactions on panorama ES.
    canvas.style.background = "transparent";
    canvas.style.top = "0px";
    canvas.style.left = "0px";
    canvas.style.pointerEvents = "none";
    parentElement.appendChild(canvas);

    orchestrator.playerStateChangedEvent.subscribe(function (state) {
        for (id in currentEAList) {
            if (currentEAList.hasOwnProperty(id)) {
                currentEAList[id].actualEA.onPlayerStateChanged(state);
            }
        }
    });

    // Execute appropriate behaviors if an EA is asking for one
    var onInteractionRequest = function (args) {
        var matchedSourceItem;
        // Find the source item for the ea
        for (id in currentEAList) {
            if (currentEAList.hasOwnProperty(id)) {
                if (currentEAList[id].actualEA === args.actualEA)
                {
                    matchedSourceItem = currentEAList[id].sourceItem;
                    break;
                }
            }
        }
        if (!matchedSourceItem || !matchedSourceItem.defaultInteractionBehavior) return;

        args.orchestrator = orchestrator;
        args.host = self;
        args.sourceItem = matchedSourceItem;
        rin.interactionBehaviorService.executeInteractionBehavior(matchedSourceItem.defaultInteractionBehavior, args);
    };

    this.updateLayout = function () {
        for (id in currentEAList) {
            if (currentEAList.hasOwnProperty(id)) {
                var ea = currentEAList[id];
                // update ea position
                if (ea.actualEA.visual && ea.actualEA.visual.style) {
                    var offset = ea.actualEA.getAnchoredOffset();
                    ea.actualEA.visual.style.left = (ea.state.display.position.center.x - offset.x) + "px";
                    ea.actualEA.visual.style.top = (ea.state.display.position.center.y - offset.y) + "px";
                    // Hide the ea by opacity till the visual is loaded and redered once so that the proper anchoring position can be calculated. Else the EA will jump around initially before they appear right.
                    ea.actualEA.visual.style.opacity = (ea.actualEA.visual.clientWidth > 0 && ea.actualEA.visual.clientHeight > 0) ? ea.state.display.opacity || 1 : 0;
                    ea.actualEA.visual.style.display = ea.active ? displayState.visible : displayState.hidden;
                    if (ea.state.display.scale) // null, undefined, 0.0 are all invalid values for scale.
                        ea.actualEA.visual.style.transform = "scale(" + ea.state.display.scale + "," + ea.state.display.scale + ")";
                }
                if (ea.active && ea.state.sound) {
                    ea.actualEA.setVolume(ea.state.sound.level);
                }
                else {
                    ea.actualEA.setVolume(0);
                }
            }
        }
    };
    
    this.update = function (eaList) {
        // remove existing items if not present in updated list
        for (id in currentEAList) {
            if (currentEAList.hasOwnProperty(id) && !eaList.hasOwnProperty(id)) {
                self.removeArtifact(currentEAList[id]);
            }
        }

        // process updated list
        for (id in eaList) {
            var ea = eaList[id];
            if (eaList.hasOwnProperty(id) && !currentEAList.hasOwnProperty(id)) {
                self.addArtifact(ea);
            }
        }

        this.updateLayout();
    };

    this.checkOverlap = function (a, b) { return false; };

    // Add a new artifact to the host
    this.addArtifact = function (ea) {
        if (!ea) return;
        currentEAList[ea.sourceItem.id] = ea;
        
            var base = window;
            for (var i = 0, ns = ea.sourceItem.eaTypeId.split('.') ; i < ns.length; ++i) {
                base = base[ns[i]];
            }

        if(typeof base == "function"){
            ea.actualEA = new base(ea.sourceItem, resourceResolver);
            ea.actualEA.isInPlayMode = orchestrator.getPlayerState() == rin.contracts.playerState.playing;

            rin.embeddedArtifacts.artifactManager.loadArtifactVisual(ea.actualEA, resourceResolver, function (visual) {
                visual.eaid = ea.sourceItem.id;
                visual.style.display = "none";
                // make sure the ea is still in active list
                if (!currentEAList.hasOwnProperty(ea.sourceItem.id)) return;
                ea.actualEA.visual = visual;
                ko.applyBindings(ea.actualEA, visual);
                //ea.layoutChanged.subscribe(self.updateLayout, null, this);
                ea.actualEA.interactionRequested.subscribe(onInteractionRequest, null, this);
                
                canvas.appendChild(visual);
                if (ea.actualEA.visualLoadComplete)
                    ea.actualEA.visualLoadComplete();
            });
        }
    };

    // Remove an existing artifact from the host
    this.removeArtifact = function (ea) {
        if (currentEAList.hasOwnProperty(ea.sourceItem.id)) {
            // remove data and bindings
            delete currentEAList[id];
            ea.actualEA.interactionRequested.unsubscribe(onInteractionRequest);
            //ea.layoutChanged.unsubscribe(self.updateLayout);

            // remove the visual
            for (var i = 0; i < canvas.children.length; i++) {
                var currentChild = canvas.children[i];
                if (currentChild.eaid == ea.sourceItem.id) {
                    canvas.removeChild(currentChild);
                    return;
                }
            }
        }
    };

    this.removeAll = function(removeSelf){
        for (id in currentEAList) {
            if (currentEAList.hasOwnProperty(id)) {
                self.removeArtifact(currentEAList[id]);
            }
        }

        if (removeSelf == true) {
            if (canvas.parentElement && typeof canvas.parentElement.removeChild === "function") //TODO: Investigate why this is needed. Added for everest as an expection was thrown from here that causes pano to be unresponsive.
                canvas.parentElement.removeChild(canvas);
        }
    };

    this.show = function () { canvas.style.display = "block"; };
    this.hide = function () { canvas.style.display = "none"; };

    this.updateLayout();
};