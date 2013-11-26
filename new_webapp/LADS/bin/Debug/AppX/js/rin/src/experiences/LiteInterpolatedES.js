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
    // Simple lite ES that interpolates doubles and uses InterpolatedKeyframeESBase as base class.
    var LiteInterpolatedES = function (orchestrator, esData) {
        LiteInterpolatedES.parentConstructor.apply(this, arguments);

        this._userInterfaceControl = rin.util.createElementWithHtml(LiteInterpolatedES.elementHTML).firstChild;
        this._valuePlaceholder = $(".rinPlaceholderValue", this._userInterfaceControl)[0];

        esData.data.defaultKeyframe = esData.data.defaultKeyframe || {
            "state": {
                "text": "Test starting...",
                "value": 0
            }
        };
    };

    rin.util.extend(rin.contracts.InterpolatedKeyframeESBase, LiteInterpolatedES);

    LiteInterpolatedES.prototypeOverrides = {
        // Load and display the ES.
        load: function (experienceStreamId) {
            this.addSliverInterpolator("value", function (sliverId, state) {
                return new rin.Ext.Interpolators.linearDoubleInterpolator(sliverId, state);
            });

            LiteInterpolatedES.parentPrototype.load.call(this, experienceStreamId);
            this.setState(rin.contracts.experienceStreamState.ready);
        },
        // Apply/Interpolate to a keyframe.
        displayKeyframe: function (keyframeData) {
            rin.util.assignAsInnerHTMLUnsafe(this._valuePlaceholder, keyframeData.state.value.toFixed(1));
            rin.util.assignAsInnerHTMLUnsafe(this._userInterfaceControl.firstChild, keyframeData.state.text)
        }
    };

    rin.util.overrideProperties(LiteInterpolatedES.prototypeOverrides, LiteInterpolatedES.prototype);
    LiteInterpolatedES.elementHTML = "<div style='position:absolute;width:100%;height:100%'><div style='color:red;position:absolute;width:100%;height:100%'></div><div style='color:white;position:absolute;right:20px;top:20px;' class='rinPlaceholderValue'></div></div>";
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.LiteInterpolatedExperienceStream", function (orchestrator, esData) { return new LiteInterpolatedES(orchestrator, esData); });
})(rin);