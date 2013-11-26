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
    // Lite ES that interpolates doubles and uses DiscreteKeyframeESBase as base class.
    var LiteDiscreteES = function (orchestrator, esData) {
        LiteDiscreteES.parentConstructor.apply(this, arguments);

        this._userInterfaceControl = rin.util.createElementWithHtml(LiteDiscreteES.elementHTML).firstChild;
        this._valuePlaceholder = $(".rinPlaceholderValue", this._userInterfaceControl)[0];
    };

    rin.util.extend(rin.contracts.DiscreteKeyframeESBase, LiteDiscreteES);

    LiteDiscreteES.prototypeOverrides = {
        // Load and display the ES.
        load: function (experienceStreamId) {
            LiteDiscreteES.parentPrototype.load.call(this, experienceStreamId);
            this.setState(rin.contracts.experienceStreamState.ready);
        },
        // Pause the player.
        pause: function (offset, experienceStreamId) {
            LiteDiscreteES.parentPrototype.pause.call(this, offset, experienceStreamId);
            if (this._activeValueAnimation !== null) {
                this._activeValueAnimation.stop();
                this._activeValueAnimation = null;
            }
        },
        // Apply/Interpolate to a keyframe.
        displayKeyframe: function (keyframeData, nextKeyframeData, interpolationOffset) {
            var curKeyValue, curKeyText,
                // If there is another keyframe following current one, load that for interpolation.
                nextKeyValue = nextKeyframeData && nextKeyframeData.state.value;

            // Load current keyframe.
            if (keyframeData) {
                curKeyValue = keyframeData.state.value;
                curKeyText = keyframeData.state.text;

                // start volume interpolation to next key volume if one is present.
                if (nextKeyValue) {
                    var keyframeDuration = nextKeyframeData.offset - keyframeData.offset;
                    var animation = new rin.internal.DoubleAnimation(keyframeDuration, curKeyValue, nextKeyValue);
                    curKeyValue = animation.getValueAt(interpolationOffset);
                    this._animateValue(curKeyValue, nextKeyValue, keyframeDuration - interpolationOffset);
                }

                rin.util.assignAsInnerHTMLUnsafe(this._userInterfaceControl.firstChild, curKeyText);
                rin.util.assignAsInnerHTMLUnsafe(this._valuePlaceholder, ~~curKeyValue);
            }
        },
        // Interpolate volume for smooth fade in and out.
        _animateValue: function (from, to, animationTime) {
            var self = this;
            var valueAnim = new rin.internal.DoubleAnimation(animationTime, from, to);
            var valueAnimationStoryboard = new rin.internal.Storyboard(
                valueAnim,
                function (value) {
                    rin.util.assignAsInnerHTMLUnsafe(self._valuePlaceholder, ~~value);
                },
                function () { self._activeValueAnimation = null; });

            if (this._activeValueAnimation !== null) {
                this._activeValueAnimation.stop();
                this._activeValueAnimation = null;
            }

            valueAnimationStoryboard.begin();
            this._activeValueAnimation = valueAnimationStoryboard;
        },
        _activeValueAnimation: null,
    };

    rin.util.overrideProperties(LiteDiscreteES.prototypeOverrides, LiteDiscreteES.prototype);
    LiteDiscreteES.elementHTML = "<div style='position:absolute;width:100%;height:100%'><div style='color:red;position:absolute;width:100%;height:100%'>Starting Test...</div><div style='color:white;position:absolute;right:20px;top:20px;' class='rinPlaceholderValue'></div></div>";
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.LiteDiscreteExperienceStream", function (orchestrator, esData) { return new LiteDiscreteES(orchestrator, esData); });
})(rin);