/// <reference path="Common.js"/>
/// <reference path="TaskTimer.js"/>
/// <reference path="ESItem.js"/>
/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="EventLogger.js"/>

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

rin.internal.DefaultScreenPlayInterpreter = function () {
    this._allESItems = new rin.internal.List();
};

rin.internal.DefaultScreenPlayInterpreter.prototype = {
    _allESItems: null,
    _orchestrator: null,
    _screenPlayData: null,

    initialize: function (screenPlayId, segmentData, orchestrator) {
        this._screenPlayData = segmentData.screenplays[screenPlayId].data;
        this.id = screenPlayId;
        this._orchestrator = orchestrator;

        var esItems = new rin.internal.List(),
            lastZIndex = 0,
            experienceStreamReferenceList = this._screenPlayData.experienceStreamReferences,
            experienceStreamReference, experienceId, esData, es, esLayer, experienceStreamId, esItem, control;
        for (var i = 0, len = experienceStreamReferenceList.length; i < len; i++) {
            experienceStreamReference = experienceStreamReferenceList[i];
            experienceId = experienceStreamReference.experienceId;
            experienceStreamId = experienceStreamReference.experienceStreamId;
            if (experienceStreamReference.layer) {
                esLayer = rin.contracts.experienceStreamLayer[experienceStreamReference.layer] || rin.contracts.experienceStreamLayer.background;
            }
            esData = segmentData.experiences[experienceId];
            if (!esData) { rin.internal.debug.write("Experience Data not available for " + experienceId); continue; }
            esData.id = experienceId;
            esData.experienceId = experienceId;
            es = orchestrator.createExperienceStream(esData.providerId, esData);
            if (!es) continue; //todo: need to implement delay loading

            // bleveque: added the below to check if there are any other exp streams with same id (i.e. same track) -- in that case, use the same zIndex
            var existSameTrack = { bool: false, zIndex: 0 };
            for (var ii = 0; ii < esItems.length; ii++) {
                if (esItems[ii].id === esData.id) {
                    existSameTrack.bool = true;
                    existSameTrack.zIndex = esItems[ii].zIndex;
                    break;
                }
            }
            var finalZIndex = 0;
            if (existSameTrack.bool)
                finalZIndex = existSameTrack.zIndex;
            else
                finalZIndex = parseInt(experienceStreamReference.zIndex) || lastZIndex++;
            // end bleveque

            esItem = new rin.internal.ESItem(esData.id, esData, es,
                                finalZIndex,
                                experienceStreamReference.begin,
                                (parseFloat(experienceStreamReference.begin) + parseFloat(experienceStreamReference.duration)),
                                esLayer);
            esItem.experienceId = experienceId;
            esItem.currentExperienceStreamId = experienceStreamId;
            esItem.providerId = esData.providerId;
            esItem.volumeLevel = parseFloat(experienceStreamReference.volume) || 1;
            control = es.getUserInterfaceControl();
            if (control && control.setAttribute) control.setAttribute("ES_ID", esData.id);
            esItems.push(esItem);
        }
        this._allESItems = esItems;
    },

    getESItems: function (fromOffset, toOffset) {
        if (typeof fromOffset == "undefined") return this._allESItems;
        // change to milliseconds
        fromOffset = fromOffset;
        toOffset = toOffset || fromOffset + .1 /*epsilon*/ ;
        return this._allESItems.filter(function (es) { return es.beginOffset <= toOffset && es.endOffset > fromOffset; });

    },

    setScreenPlayAttributes: function (esInfo) {
        if (!esInfo.experienceStream || !esInfo.experienceStream.setVolume || !esInfo.experienceStream.setIsMuted || esInfo.volumeLevel === undefined) return;

        esInfo.experienceStream.setVolume(this._orchestrator.getPlayerVolumeLevel() * esInfo.volumeLevel);
        esInfo.experienceStream.setIsMuted(this._orchestrator.getIsMuted());
    },

    getRelativeLogicalTime: function (esItem, absoluteLogicalTimeOffset) {
        rin.internal.debug.assert(esItem instanceof rin.internal.ESItem);

        var relativeLogicalTimeOffset = esItem ? absoluteLogicalTimeOffset - esItem.beginOffset : absoluteLogicalTimeOffset;
        relativeLogicalTimeOffset = Math.max(relativeLogicalTimeOffset, 0);
        return relativeLogicalTimeOffset;
    },

    getEndTime: function () {
        if (this._allESItems.length == 0) return 0;

        var lastItem = this._allESItems.max(function (item) { return item.endOffset; });
        return lastItem ? lastItem.endOffset : 0;
    }
};