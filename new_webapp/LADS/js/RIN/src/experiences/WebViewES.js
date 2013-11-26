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
    // ES for displaying web pages.
    var WebViewES = function (orchestrator, esData) {
        WebViewES.parentConstructor.apply(this, arguments);
        var self = this;
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(WebViewES.elementHTML).firstChild;
        this._iFrame = this._userInterfaceControl.children[0]; // IFrame used to load the webpage
        this._controlDiv = this._userInterfaceControl.children[1]; // Div sitting over the IFrame to intercept user interactions.
        this._esData = esData;
        this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);

        $(this._controlDiv).bind("mousedown", function (e) {
            self._controlDiv.style.display = "none"; // Remove the overlay div so that the user can interact with the web page.
            self._orchestrator.startInteractionMode();
        });
        $(this._controlDiv).bind("mousewheel", function (e) {
            self._controlDiv.style.display = "none"; // Remove the overlay div so that the user can interact with the web page.
            self._orchestrator.startInteractionMode();
        });
    };

    rin.util.extend(rin.contracts.DiscreteKeyframeESBase, WebViewES);

    WebViewES.prototypeOverrides = {
        // Load the ES and start loading the webpage.
        load: function (experienceStreamId) {
            if (!this._url)
                throw new Error("WebView source not found!");

            var self = this;
            this.setState(rin.contracts.experienceStreamState.buffering);

            // Load the page in the IFrame
            this._iFrame.onerror = function(source) {
                rin.internal.debug.write("error while loading iframe " + source);
                return true;                
            }
            this._iFrame.src = this._url;
            this._iFrame.onload = function () {
                try
                {
                    self.setState(rin.contracts.experienceStreamState.ready);
                }
                catch(err)
                {
                    rin.internal.debug.write("error on iframe load " + err);
                }
            };
        },
        play: function (offset, experienceStreamId) {
            // Add the overlay div back in place to monitor for interactions.
            this._controlDiv.style.display = "block";
        },
        _url: null,
    };

    rin.util.overrideProperties(WebViewES.prototypeOverrides, WebViewES.prototype);
    WebViewES.elementHTML = "<div style='height:100%;width:100%;position:absolute;border:0px;'><iframe style='overflow:hidden;height:100%;width:100%;position:absolute;border:none;'></iframe><div style='height:100%;width:100%;position:absolute;background-color:rgba(1,1,1,.001);'></div></div>";
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.WebViewExperienceStream", function (orchestrator, esData) { return new WebViewES(orchestrator, esData); });
})(rin);