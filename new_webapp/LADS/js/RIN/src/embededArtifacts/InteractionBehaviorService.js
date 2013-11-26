/// <reference path="../contracts/IOrchestrator.js" />
/// <reference path="../contracts/IExperienceStream.js" />
/// <reference path="../core/Common.js" />
/// <reference path="../core/Orchestrator.js" />

window.rin = window.rin || {};
rin.embeddedArtifacts = rin.embeddedArtifacts || {}

// Container class for all arguments for making an interaction request
rin.InteractionBehaviorArgs = function (orchestrator, sourceES, sourceEA) {
    this.orchestrator = orchestrator;
    this.sourceES = sourceES;
    this.sourceEA = sourceEA;
};

// Module to register and execute interaction behaviors.
// We are not using behavior factories here to keep things simple. In most cases behaviors dosent have a state of its own
// so we need not instantiate new objects for executing one behavior. In case a behavior have state, it can internally create a 
// new behavior object inside the execute() call.
rin.interactionBehaviorService = {
    _behaviors: [],

    registerInteractionBehavior: function (behaviorKey, behavior) {
        if (!behavior || !behaviorKey) return;
        if (typeof (behavior.execute) != "function") return;
        this._behaviors.push({ key: behaviorKey, value: behavior });
    },

    executeInteractionBehavior: function (behaviorKey, interactionArgs, onCompleteCallback) {
        if (!behaviorKey || !interactionArgs) return;

        for (var i = this._behaviors.length - 1; i >= 0; i--) {
            if (this._behaviors[i].key === behaviorKey) {
                this._behaviors[i].value.execute(interactionArgs, onCompleteCallback || function () { });
                break;
            }
        }
    }
};
