///<reference path="Common.js"/>
///<reference path="..\Core\Utils.js"/>
///<reference path="TaskTimer.js"/>
///<reference path="ESItem.js"/>
///<reference path="..\contracts\IExperienceStream.js"/>
///<reference path="ScreenPlayInterpreter.js"/>
///<reference path="EventLogger.js"/>
///<reference path="..\Core\PlayerConfiguration.js"/>
///<reference path="..\Core\PlayerControl.js"/>
///<reference path="..\Core\ResourcesResolver.js"/>
/// <reference path="TransitionService.js" />

/*!
* RIN Core JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

window.rin = window.rin || {};
window.rin.internal = window.rin.internal || {};

rin.internal.StageAreaManager = function (orchestrator, stageControl) {
    this._orchestrator = orchestrator;
    this._stageControl = stageControl;
};

rin.internal.StageAreaManager.prototype = {

    onCurrentExperienceStreamsChanged: function (addedItems, removedItems, currentList, isSeek) {
        var self = this;
        var wereItemsAdded = addedItems && addedItems.length > 0;
        var wereItemsRemoved = removedItems && removedItems.length > 0;
        
        if (wereItemsRemoved) {
            for (var i = 0; i < removedItems.length; i++) {
                var item = removedItems[i];
                if (addedItems && addedItems.length > 0 && addedItems.any(function (i) { return i.experienceStream == item.experienceStream; })) continue;

                var uiElement = item.experienceStream.getUserInterfaceControl();
                if (!uiElement) continue;

                if (isSeek) {
                    // cancel any existing transition and hide element without transition
                    uiElement.style.zIndex = -1;
                    var transition = uiElement.transition;
                    if (transition) transition.cancelTransition();
                    rin.util.hideElementByOpacity(uiElement);
                }
                else { // show es with transition
                    //item.ExperienceStream.UserInterfaceControl.IsHitTestVisible = false;
                    (function (uiElement, item) {
                        var currentTransition = self._getTransition(item);
                        uiElement.transition = currentTransition;
                        currentTransition.transition.TransitionOut(uiElement, currentTransition.transitionOutDuration, function () {
                            uiElement.transition = null;
                                rin.util.hideElementByOpacity(uiElement);
                                uiElement.style.zIndex = -1;
                        });
                    })(uiElement, item);
                }
            }
        }

        if (wereItemsAdded) {
            for (var i = 0; i < addedItems.length; i++) {
                var item = addedItems[i];

                this._orchestrator.ensureExperienceStreamIsLoaded(item);
                var uiControl = item.experienceStream.getUserInterfaceControl();
                if (uiControl) {
                    if (removedItems && removedItems.length > 0 && removedItems.any(function (i) { return i.experienceStream == item.experienceStream; })) continue;

                    if (!rin.util.hasChildElement(this._stageControl.childNodes, uiControl))
                        this._stageControl.appendChild(uiControl);

                    self._setZIndex(item);

                    var currentUIControl = item.experienceStream.getUserInterfaceControl();

                    if (isSeek) {
                        // cancel any existing transition and hide element without transition
                        var transition = currentUIControl.transition;
                        if (transition) transition.cancelTransition();
                        rin.util.unhideElementByOpacity(currentUIControl);
                    }
                    else {
                        (function (item, currentUIControl) {
                            var currentTransition = self._getTransition(item);
                            setTimeout(function () {

                                currentUIControl.transition = currentTransition;
                                if (currentUIControl) {
                                    currentTransition.transition.TransitionIn(currentUIControl, currentTransition.transitionInDuration, function () {
                                        currentUIControl.transition = null;
                                        rin.util.unhideElementByOpacity(currentUIControl);
                                    });
                                }
                            }, 15);
                        })(item, currentUIControl);
                    }
                }

            }
        }
    },

    _setZIndex: function (esInfo) {
        var esLayer = esInfo.experienceStreamLayer;
        var layerRangeStart = (esLayer == rin.contracts.experienceStreamLayer.background) ? 10000 :
            (esLayer == rin.contracts.experienceStreamLayer.foreground || esLayer == rin.contracts.experienceStreamLayer.projection) ? 20000 : 30000;

        var zIndex = layerRangeStart + esInfo.zIndex || 0;
        var uiElement = esInfo.experienceStream.getUserInterfaceControl();
        if (uiElement && uiElement.style) {
            uiElement.style.zIndex = zIndex;
            uiElement.style.position = "absolute";
            this._orchestrator.eventLogger.logEvent("ZIndex set for {0} to {1}", esInfo.id, zIndex);
        }
    },
    _getTransition: function (esInfo) {
        var transition = new rin.internal.TransitionEffect(),
            transitionData;
        if (esInfo && esInfo.esData) {
            if (esInfo.esData.data && esInfo.esData.data.transition) {
                transitionData = transitionData || {};
                rin.util.overrideProperties(esInfo.esData.data.transition, transitionData);
            }
            if (esInfo.currentExperienceStreamId) {
                var currentExperienceStream = esInfo.esData.experienceStreams[esInfo.currentExperienceStreamId];
                if (currentExperienceStream && currentExperienceStream.data && currentExperienceStream.data.transition) {
                    transitionData = transitionData || {};
                    rin.util.overrideProperties(currentExperienceStream.data.transition, transitionData);
                }
            }
        }        
        if(transitionData) {
            transition.transitionInDuration = transitionData.inDuration;
            transition.transitionOutDuration = transitionData.outDuration;
        }

        return transition;
    },
    _orchestrator: null,
    _stageControl: null
};

rin.internal.TransitionEffect = function (transition) {
    this.transition = transition || new rin.FadeInOutTransitionService();
};

rin.internal.TransitionEffect.prototype = {
    transition: null,
    transitionInDuration: .5,
    transitionOutDuration: .5,
    cancelTransition: function () { this.transition.cancelTransition(); }
};