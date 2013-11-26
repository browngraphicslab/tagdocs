/// <reference path="../core/Common.js"/>
/// <reference path="../core/TaskTimer.js"/>
/// <reference path="../core/ESItem.js"/>
/// <reference path="../core/ESTimer.js"/>
/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="../contracts/IOrchestrator.js"/>
/// <reference path="../core/ScreenPlayInterpreter.js"/>
/// <reference path="../core/Orchestrator.js"/>
/// <reference path="../core/ESItemsManager.js"/>
/// <reference path="../core/EventLogger.js"/>

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

// ResourceResolver handles resolving named resources to absolute URIs.
rin.internal.ResourcesResolver = function (playerConfiguration) {
    this._playerConfiguration = playerConfiguration;
};

rin.internal.ResourcesResolver.prototype = {
    rinModel: null,
    _playerConfiguration: null,
    _systemRootUrl: null,
    // Resolve a named resource to an absolute URI.
    resolveResource: function (resourceItemId, experienceId, bandwidth) { //todo: implement
        var resourceItem = this.rinModel.resources[resourceItemId];
        if (experienceId && this.rinModel.experiences[experienceId] && this.rinModel.experiences[experienceId].resources)
            resourceItem = this.rinModel.experiences[experienceId].resources[resourceItemId] || resourceItem;
        var url = resourceItem ? resourceItem.uriReference : resourceItemId;

        // See if the resource URL is relative.
        if (!rin.util.isAbsoluteUrl(url)) {
            var baseUrl = this._playerConfiguration.narrativeRootUrl || rin.util.getDocumentLocationRootUrl();
            url = rin.util.combinePathElements(baseUrl, url);
        }
        return url;
    },
    // Resolve a named resource to a data object.
    resolveData: function (resourceItemId, experienceId) { 
        var resourceItem = this.rinModel.resources[resourceItemId];
        if (experienceId && this.rinModel.experiences[experienceId] && this.rinModel.experiences[experienceId].resources)
            resourceItem = this.rinModel.experiences[experienceId].resources[resourceItemId] || resourceItem;
        if (resourceItem && resourceItem.data && typeof resourceItem.data === "object") { 
            return rin.util.deepCopy(resourceItem.data);
        };
        return null;
    },
    // Return the root URL of the player.
    getSystemRootUrl: function () {
        this._systemRootUrl = this._systemRootUrl || rin.util.combinePathElements(rin.util.getDocumentLocationRootUrl(), this._playerConfiguration.systemRootUrl, "systemResources/themeResources");
        return this._systemRootUrl;
    },
    // Resolve a resource from relative to absolute URI.
    resolveSystemResource: function (relativeResourceLocation) {
        // FUTURE$ Theme & language will be looked up to resolve to right URL.
        var absoluteUrl = rin.util.combinePathElements(this.getSystemRootUrl(), relativeResourceLocation);
        return absoluteUrl;
    }
};