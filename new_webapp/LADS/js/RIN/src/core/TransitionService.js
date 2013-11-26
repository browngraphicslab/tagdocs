/// <reference path="Common.js"/>
/// <reference path="../core/Utils.js"/>
/// <reference path="TaskTimer.js"/>
/// <reference path="ESItem.js"/>
/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="ScreenPlayInterpreter.js"/>
/// <reference path="EventLogger.js"/>
/// <reference path="../core/PlayerConfiguration.js"/>
/// <reference path="../core/PlayerControl.js"/>
/// <reference path="../core/ResourcesResolver.js"/>

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

// Transition to immediatly switch from one ES to other without any gradual changes.
rin.internal.CutSceneTransitionService = function () {
};

rin.internal.CutSceneTransitionService.prototype = {
    // Show an ES with the in transition.
    TransitionIn: function (element, transitionTime, onCompleted) {
        rin.util.unhideElementByOpacity(element); // Show the ES immediatly.
        if (typeof onCompleted == "function") onCompleted();
    },

    // Hide an ES with the out transition.
    TransitionOut: function (element, transitionTime, onCompleted) {
        rin.util.hideElementByOpacity(element);
        if (typeof onCompleted == "function") onCompleted();
    }
};

// Transition to gradually fade in the new ES and fade out the previous one.
rin.FadeInOutTransitionService = function () {
};

rin.FadeInOutTransitionService.prototype = {
    attachedElement: null,
    _storyboard : null,
    _type: 0, // 1 for in, 2 for out

    // Show an ES with the in transition.
    TransitionIn: function (element, transitionTime, onCompleted) {
        this.attachedElement = element;
        this._type = 1;
        this._animate(element, transitionTime, 0, 1, onCompleted);
    },

    // Hide an ES with the out transition.
    TransitionOut: function (element, transitionTime, onCompleted) {
        this.attachedElement = element;
        this._type = 2;
        this._animate(element, transitionTime, 1, 0, onCompleted);
    },

    // Cancel the active transition.
    cancelTransition: function () {
        var toOpacity = (this._type === 1) ? 1 : 0;
        this._storyboard.stop();
        rin.util.setElementOpacity(this.attachedElement, toOpacity);
    },

    pause: function () {
        this._storyboard.pause();
    },

    _animate: function (element, transitionTime, opacityFrom, opacityTo, onCompleted) {
        var onAnimate = function (value) { rin.util.setElementOpacity(element, value); }
        this._storyboard = new rin.internal.Storyboard(new rin.internal.DoubleAnimation(transitionTime, opacityFrom, opacityTo), onAnimate, onCompleted);
        this._storyboard.begin();
    }
};