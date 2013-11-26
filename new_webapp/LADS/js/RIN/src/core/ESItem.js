/// <reference path="Common.js"/>
/// <reference path="TaskTimer.js"/>
/// <reference path="../contracts/IExperienceStream.js" />

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

// Class that describes an experienceStream with its metadata such as id, offsets, zIndex etc.
rin.internal.ESItem = function (id, esData, experienceStream, zIndex, beginOffset, endOffset, experienceStreamLayer) {
    this.id = id;
    this.esData = esData;
    this.experienceStream = experienceStream;
    this.beginOffset = beginOffset || 0;
    this.endOffset = endOffset || Infinity;
    this.experienceStreamLayer = experienceStreamLayer || rin.contracts.experienceStreamLayer.background;
    this.zIndex = zIndex || 0;
    this.providerId = "UnknownOrSystem";
}

rin.internal.ESItem.prototype = {
    id: "",
    esData: null,
    experienceStream: rin.contracts.IExperienceStream,
    beginOffset: 0,
    endOffset: 0,
    experienceStreamLayer: null,
    zIndex: 0,
    screenPlayInfo: null,
    _isLoadCalled: false,

    // string description used in event logs and in debugging.
    toString: function () {
        return "{0} ({1}:{2}-{3}:{4}) ES:{5}".rinFormat(this.id,
            this.beginOffset / 60, this.beginOffset % 60,
            this.endOffset / 60, this.endOffset % 60,
            this.experienceStream.state);
    }
};