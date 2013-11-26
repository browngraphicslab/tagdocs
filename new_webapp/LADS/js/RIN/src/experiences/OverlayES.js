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

//To bind a UI element directly using knockout
ko.bindingHandlers.element = {
    update: function (element, valueAccessor) {
        var elem = ko.utils.unwrapObservable(valueAccessor());
        $(element).empty();
        $(element).append(elem);
    }
};

rin.OverlayES = function (orchestrator, esData) {
    this._orchestrator = orchestrator;

    this._esData = esData;

    this._userInterfaceControl = rin.util.createElementWithHtml("<div></div>").firstChild;

    var contenttype = esData.data.contentType;
    var lowercaseContent = contenttype.toLowerCase();
    //Load the mediaoverlays.htm for the non-text experience streams mentioned below
    switch (lowercaseContent) {
        case "audio":
        case "video":
        case "zoomableimage":
        case "singledeepzoomimage":
        case "photosynth":
            contenttype = "MediaOverlays";
            break;
    }

    var resourceResolver = this._orchestrator.getResourceResolver();
    var htmlfile = resourceResolver.resolveSystemResource('overlays/' + contenttype + '.htm');

    var self = this;

    //--Download the theme based htm file
    var htmlDownload = {
        url: htmlfile,
        dataType: "html",
        error: function (jqxhr, textStatus, errorThrown) {
            self.setState(rin.contracts.experienceStreamState.error);
            self._orchestrator.eventLogger.logErrorEvent("Error: {0} downloading the html file: {1}", errorThrown, htmlfile);
        },
        success: function (data, textStatus, jqxhr) {
            self._userInterfaceControl = rin.util.createElementWithHtml(data).firstChild;

            $(self._userInterfaceControl).bind("mousedown", function (e) {
                self._orchestrator.startInteractionMode();
            });

            self._isHtmlLoaded = true;
            self.checkReady();
        }
    };
    $.ajax(htmlDownload);

    this._userInterfaceControl.hide = function () {
        lastZIndex = control.style.zIndex;
        control.style.zIndex = -10000;
    };

    //--from the es data, load the collection json
    var resourceResolver = this._orchestrator.getResourceResolver();
    var resourceName = resourceResolver.resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);
    this.setState(rin.contracts.experienceStreamState.buffering);

    if (resourceName) {
        var cache = !(self._orchestrator.getPlayerConfiguration().playerMode === rin.contracts.playerMode.AuthorerPreview || self._orchestrator.getPlayerConfiguration().playerMode === rin.contracts.playerMode.AuthorerEditor);
        rin.internal.JSONLoader.loadJSON(resourceName, function (data, jsonUrl) {
            self._collectionData = rin.internal.JSONLoader.processCollectionJSON(jsonUrl, data[0].collection, resourceResolver);
            self._isResourceLoaded = true;
            rin.internal.debug.write("Load called for collection" + jsonUrl);
            self.checkReady();
        }, function (error, jsonUrl) {
            self._isResourceLoaded = false;
            self.setState(rin.contracts.experienceStreamState.error);
            self._orchestrator.eventLogger.logErrorEvent("Error: {0} downloading the json file: {1}", error, jsonUrl);
        }, cache);
    }

    //--Check to see if both html and json collection are loaded and then set the state of the ES to ready
    this.checkReady = function () {
        if (self._isHtmlLoaded && self._isResourceLoaded)
            self.setState(rin.contracts.experienceStreamState.ready);
    }
    this._userInterfaceControl.unhide = function () { control.style.zIndex = lastZIndex; }
};

rin.OverlayES.prototype = new rin.contracts.DiscreteKeyframeESBase();
rin.OverlayES.base = rin.contracts.DiscreteKeyframeESBase.prototype;
rin.OverlayES.changeTrigger = { none: 0, onkeyframeapplied: 1, onnext: 2, onprevious: 3, onclick: 4 };
rin.OverlayES.currentMode = { preview: 0, expanded: 1 };

rin.OverlayES.prototypeOverrides = {
    load: function (experienceStreamId) {
        rin.OverlayES.base.load.call(this, experienceStreamId);
    },
    unload: function () {
        rin.OverlayES.base.unload.call(this);
    },
    getViewModel: function (itemId, collectionData, orchestrator) {
        //--Get the current item to be displayed from the keyframe
        var itemData = collectionData.items[itemId];
        if (itemData) {
            var self = this;
            var overlayViewModel = {
                overlayCollection: collectionData,
                orchestrator: orchestrator,
                currentItem: null,
                expandedItem: null,
                itemId: null,
                currentMode: rin.OverlayES.currentMode.preview,
                isExpanded: ko.observable(false),
                isBlurbVisible: ko.observable(true),
                onClickMore: function () {
                    self.overlayViewModel.isExpanded(true);
                    self.overlayViewModel.isBlurbVisible(false);
                },
                onExplore: function () {
                //--on click of cue, launch the associated behavior
                    this.currentMode = rin.OverlayES.currentMode.expanded;
                    if (this.currentItem.defaultExpandedModeBehavior) {
                        var behaviorFactory = rin.ext.getFactory(rin.contracts.systemFactoryTypes.behaviorFactory, this.currentItem.defaultExpandedModeBehavior);
                        if (behaviorFactory) {
                            var overlayBehavior = behaviorFactory(this.orchestrator);
                            if (overlayBehavior) {
                                overlayBehavior.executeBehavior({ "DataContext": this.currentItem, "CollectionData": this.overlayCollection }, function () {
                                    this.currentMode = rin.OverlayES.currentMode.preview;
                                });
                            }
                        }
                    }
                }
            };

            //--If its a play in place overlay, create a rines dynamically
            //--add it to the current overlay UI
            //--Subscribe to the ES events and sync the rines with the current overlay state(ESState and Play/Pause)
            if (itemData.playInPlace) {
                if (itemData.experienceStream === undefined) {                    
                    var rinESNarrative = rin.internal.esDataGenerator.getExperienceStream(
                        { "srcType": "MicrosoftResearch.Rin.RinExperienceStream",
                            "duration": itemData.smallMediaDuration || itemData.duration,
                            "smallMediaStartOffset": itemData.smallMediaStartOffset
                        });
                    var rinESData = rinESNarrative.experiences[rinESNarrative.id];
                    rinESData.id = rinESData.experienceId = rinESNarrative.id;

                    //--Generate the current item's associated narrative and assign it to the rinES
                    var itemESData = rin.internal.esDataGenerator.getExperienceStream(itemData);
                    rinESData.narrativeData = itemESData;
                    //--get the RinExperience stream
                    itemData.experienceStream = orchestrator.createExperienceStream("MicrosoftResearch.Rin.RinExperienceStream", rinESData, orchestrator);
                    this._subscribeToESEvents(itemData, itemData.experienceStream, rinESNarrative.id);
                    //--Load the rines
                    itemData.experienceStream.load(rinESData.id);
                    //--assign the rin escontrol UI to be bound in the Mediaoverlay
                    itemData.esControl = itemData.experienceStream._userInterfaceControl;
                }
            }
            //--We have a single overlay for sidebar text/blurb.
            //--So if there is a launch artifact specified in the itemdata, 
            //--show up the blurb first and assign the launch artifact id data to expanded item.
            //--else assign the itemdata to the expanded item to show up the side bar text
            if (typeof itemData.launchArtifact === "string") {
                overlayViewModel.expandedItem = collectionData.items[itemData.launchArtifact];
                overlayViewModel.isExpanded(false);
                overlayViewModel.isBlurbVisible(true);
                this._subscribeToPlayerEvents(overlayViewModel);
            }
            else {
                overlayViewModel.expandedItem = itemData;
                overlayViewModel.isExpanded(true);
                overlayViewModel.isBlurbVisible(false);
            }
            if (typeof itemData.fontColor === "string") {
                if (itemData.fontColor.length > 6) {
                    itemData.fontColor = "#" + itemData.fontColor.substring(3);
                }
            }
            else {
                itemData.fontColor = "#fcfcfc";
            }

            //--After setting all the properties, set the current item value and return the overlay view model.
            overlayViewModel.currentItem = itemData;

            return overlayViewModel;
        }
        return null;
    },
    _subscribeToPlayerEvents: function (overlayViewModel) {
        //--Sync up the player with the blurb expanded /collapsed mode.
        if (this._playerSubscription)
            this._playerSubscription.dispose();

        var self = this;
        this._playerSubscription = this._orchestrator.playerStateChangedEvent.subscribe(function () {
            var playerState = self._orchestrator.getPlayerState();
            if (playerState == rin.contracts.playerState.playing) {
                self.overlayViewModel.isExpanded(false);
                self.overlayViewModel.isBlurbVisible(true);
            }
        });
    },

    _subscribeToESEvents: function (itemData, experienceStream, uniqueId) {
        //--Sync up the ES events incase its a play in place overlay
        if (this._esSubscription)
            this._esSubscription.dispose();

        var self = this;
        this._esSubscription = experienceStream.stateChangedEvent.subscribe(function (esStateChangedEventArgs) {
            //--Check to see if this is the same experiencestream we had subscribed to.
            if (esStateChangedEventArgs.source._esData.id == uniqueId)
                self.setState(esStateChangedEventArgs.toState);
        }, uniqueId);
    },

    _bindOverlay: function (itemId, show) {
        if (this._collectionData != null && itemId && this._isHtmlLoaded) {
            //--form the view model from the itemid and apply bindings
            var $control = $(this._userInterfaceControl);

            if (typeof (this.overlayViewModel) === "undefined" || this.overlayViewModel == null || this.overlayViewModel.itemId != itemId) {
                this.overlayViewModel = this.getViewModel(itemId, this._collectionData, this._orchestrator);
                if (this.overlayViewModel != null && this.overlayViewModel.currentItem != null) {
                    this.overlayViewModel.itemId = itemId;
                    ko.applyBindings(this.overlayViewModel, this._userInterfaceControl);
                }
            }

            if (show === true) {
                if (this.overlayViewModel.currentItem.show !== show) {
                    $control.stop().fadeIn(1000);
                }
                //--If there is a Play in place overlay, call play on the experience stream
                if (this.overlayViewModel.currentItem.playInPlace && this.overlayViewModel.currentItem.experienceStream != null) {
                    if (typeof (this.overlayViewModel.currentItem.experienceStream.setVolume) === "function") {
                        this.overlayViewModel.currentItem.experienceStream.setVolume(this._baseVolume);
                    }
                    if (typeof (this.overlayViewModel.currentItem.experienceStream.setIsMuted) === "function") {
                        this.overlayViewModel.currentItem.experienceStream.setIsMuted(this._isMuted);
                    }
                }
            }
            else {
                if (this.overlayViewModel.currentItem.show !== show) {
                    $control.stop().fadeOut(1000);
                    //--If there is a Play in place overlay, call pause on the experience stream
                    if (this.overlayViewModel.currentItem.playInPlace && this.overlayViewModel.currentItem.experienceStream != null) {
                        this.overlayViewModel.currentItem.experienceStream.pause();
                    }
                }
            }
            this.overlayViewModel.currentItem.show = show;
        }
    },
    displayKeyframe: function (keyframeData) {
        if (keyframeData != undefined) {
            var artifactState = keyframeData.data["ea-selstate"];
            if (artifactState != undefined) {
                for (var item in artifactState) {
                    var itemId = artifactState[item].itemid;
                    var show = artifactState[item].view && artifactState[item].view.display && artifactState[item].view.display.show !== undefined ? artifactState[item].view.display.show : true;
                    this._bindOverlay(itemId, show);
                    rin.internal.debug.write("Display keyframe called for overlay item:" + itemId);
                }
            }
        }
    },
    // Play the rines incase of play in place overlay
    play: function (offset, experienceStreamId) {
        rin.OverlayES.base.play.call(this, offset, experienceStreamId);
        if (this.getState() === rin.contracts.experienceStreamState.ready) {
            if (this.overlayViewModel != null && this.overlayViewModel.currentItem != null) {
                if (this.overlayViewModel.currentItem.playInPlace && this.overlayViewModel.currentItem.experienceStream != null)
                    this.overlayViewModel.currentItem.experienceStream.play(offset, experienceStreamId);
            }
        }
    },
    // Pause the rines incase of play in place overlay
    pause: function (offset, experienceStreamId) {
        rin.OverlayES.base.pause.call(this, offset, experienceStreamId);
        if (this.getState() === rin.contracts.experienceStreamState.ready) {
            if (this.overlayViewModel != null && this.overlayViewModel.currentItem != null) {
                if (this.overlayViewModel.currentItem.playInPlace && this.overlayViewModel.currentItem.experienceStream != null)
                    this.overlayViewModel.currentItem.experienceStream.pause(offset, experienceStreamId);
            }
        }
    },

    // Set the base volume of the overlay. This will be multiplied with the keyframed volume to get the final volume.
    setVolume: function (baseVolume) {
        this._baseVolume = baseVolume;
        if (this.overlayViewModel &&
            this.overlayViewModel.currentItem &&
            this.overlayViewModel.currentItem.playInPlace &&
            this.overlayViewModel.currentItem.experienceStream != null &&
            typeof (this.overlayViewModel.currentItem.experienceStream.setVolume) === "function") {
            this.overlayViewModel.currentItem.experienceStream.setVolume(baseVolume);
        }
    },

    // Mute or unmute the play in place stream.
    setIsMuted: function (value) {
        this._isMuted = value;
        if (this.overlayViewModel &&
            this.overlayViewModel.currentItem &&
            this.overlayViewModel.currentItem.playInPlace &&
            this.overlayViewModel.currentItem.experienceStream != null &&
            typeof (this.overlayViewModel.currentItem.experienceStream.setIsMuted) === "function") {
            this.overlayViewModel.currentItem.experienceStream.setIsMuted(value);
        }
    }
};

rin.util.overrideProperties(rin.OverlayES.prototypeOverrides, rin.OverlayES.prototype);

rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.TwodLayoutEngine", function (orchestrator, esData) { return new rin.OverlayES(orchestrator, esData); });
rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "microsoftResearch.rin.twodlayoutengine", function (orchestrator, esData) { return new rin.OverlayES(orchestrator, esData); });
