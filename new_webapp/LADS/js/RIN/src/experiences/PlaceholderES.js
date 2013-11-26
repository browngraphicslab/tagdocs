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
    // Dummy ES to replace with any ES which cannot be displayed or missing.
    var PlaceholderES = function (orchestrator, esData) {
        PlaceholderES.parentConstructor.apply(this, arguments);
        this._userInterfaceControl = rin.util.createElementWithHtml(PlaceholderES.elementHTML).firstChild;
    };

    rin.util.extend(rin.contracts.DiscreteKeyframeESBase, PlaceholderES);

    PlaceholderES.prototypeOverrides = {
        // Load and display the ES.
        load: function (experienceStreamId) {
            PlaceholderES.parentPrototype.load.call(this, experienceStreamId);
            this.setState(rin.contracts.experienceStreamState.ready);

            var esInfo = this._orchestrator.debugOnlyGetESItemInfo();
            if (esInfo) {
                rin.util.assignAsInnerHTMLUnsafe(this._userInterfaceControl.firstChild, "Placeholder ES for {0}:{1} <br/> Lifetime {2}-{3}".rinFormat(esInfo.providerId, esInfo.id,
                    esInfo.beginOffset, esInfo.endOffset));
            }
        }
    };

    rin.util.overrideProperties(PlaceholderES.prototypeOverrides, PlaceholderES.prototype);
    PlaceholderES.elementHTML = "<div style='position:absolute;width:100%;height:100%'><div style='color:red;position:absolute;width:100%;height:100%'></div><div style='color:white;position:absolute;right:20px;top:20px;' class='rinPlaceholderValue'></div></div>";
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.PlaceholderExperienceStream", function (orchestrator, esData) { return new PlaceholderES(orchestrator, esData); });
    rin.ext.setDefaultFactory(rin.contracts.systemFactoryTypes.esFactory, function (orchestrator, esData) { return new PlaceholderES(orchestrator, esData); });
})(rin);