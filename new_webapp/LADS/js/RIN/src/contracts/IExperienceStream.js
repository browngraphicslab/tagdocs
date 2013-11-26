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
rin.contracts = rin.contracts || {};

// Simple event class to enable pub-sub pattern. All rin events use this class.
rin.contracts.Event = function () {
    var callbackItems = {};

    return {
        // To subscribe to this event, call this method.
        // callback: callback function to be called when an event is published.
        // id: Optional unique id to identify this subscription. If not specified, callback pointer is used as id.
        // context: Optional context under which the callback needs to be called. If specified, the "this" variable inside the callback will refer to this context object.
        subscribe: function (callback, id, context) {
            if (typeof (callback) != "function") throw new Error("Event callback needs to be a function");
            callbackItems[id || callback] = { callback: callback, context: context || this };
        },

        // To unsubscribe, call this method with the subscription id.
        unsubscribe: function (id) {
            delete callbackItems[id];
        },

        // To publish the event, call this method with the arguments for the callbacks.
        publish: function (eventArgs, isAsync) {
            for (var id in callbackItems) {
                var callbackItem = callbackItems[id];
                if (isAsync) {
                    (function (callbackItem) {
                        setTimeout(function () { callbackItem.callback.call(callbackItem.context, eventArgs); }, 0);
                    })(callbackItem);
                }
                else {
                    callbackItem.callback.call(callbackItem.context, eventArgs);
                }
            }
        }
    }
}

// enum of states a experience stream can be in. All experience streams start at closed state, then move to buffering (if buffering is required), and then to ready or error state.
rin.contracts.experienceStreamState = {
    closed: "closed",
    buffering: "buffering",
    ready: "ready",
    error: "error"
};

// An experience provider needs to implement following methods.
//    load: function (experienceStreamId) { } // Load experience stream contents at the passed experienceStreamId
//    play: function (offset, experienceStreamId) { } // Play contents from the given offset & experienceStreamId
//    pause: function (offset, experienceStreamId) { } // Pause experience stream with the first frame displayed at given offset & experienceStreamId
//    unload: function () { } // Release all resources and unload
//    getState: function () { } // Return current state - one of states listed in rin.contracts.experienceStreamState
//    stateChangedEvent: new rin.contracts.Event() // Publish this event whenever current state changes. Callers can subscribe to this event. 
                                                   // The publisher should pass an instance of rin.contracts.ESStateChangedEventArgs to describe state change information.
//    getUserInterfaceControl: function () { } // Return html element that displays contents of this experience provider.

// Class that describes the event arguments on state changed event.
rin.contracts.ESStateChangedEventArgs = function (fromState, toState, source) {
    this.fromState = fromState;
    this.toState = toState;
    this.source = source;
};

// The UI layer an experience stream can be in. This describes implicit z-index of the experience's user interface control. This is specified in RIN data model.
rin.contracts.experienceStreamLayer = {
    background: "background",
    foreground: "foreground",
    overlay: "overlay",
    projection: "projection"
};

// List of events that an ES can broadcast to other ESs or receive from other ESs. To broadcast an event, call orchestrator.onESEvent with event id and event related data.
// To listen to esEvents broadcasted by other ESs, implement onESEvent method in experience provider and react to events.
rin.contracts.esEventIds = {
    stateTransitionEventId: "stateTransitionEvent", // This event is raised by an ES to continously broadcast changes in state information. 
    playerConfigurationChanged: "playerConfigurationChanged", // This event is raised whenever player configuration is changed at run time.
    popupDisplayEvent: "popupDisplayEvent",
    resumeTransitionEvent: "resumeTransition"
};

// Enum of system interaction controls available for an ES to use. Refer to developer documentation for how to get a system interaction control.
rin.contracts.interactionControlNames = {
    panZoomControl: "MicrosoftResearch.Rin.InteractionControls.PanZoomControl",
    mediaControl: "MicrosoftResearch.Rin.InteractionControls.MediaControl"
};

// Enum of types of factories that rin.ext registers and gives out. These are only system factories and rin.ext allows any type of factory to be registered.
rin.contracts.systemFactoryTypes = {
    esFactory: "ESFactory",
    interactionControlFactory: "InteractionControlFactory",
    behaviorFactory: "BehaviorFactory"
}

// A single instance class that holds plugins such as factories. Registering and getting factory methods such as "ES factories", "Interaction control factories" etc can be done here.
rin.ext = (function () {
    var defaultESFactoryFunction = null;
    var factoriesTypeMap = {};
    var defaultFactoryProviderId = "MicrosoftResearch.Rin.DefaultFactoryProvider";

    return {
        // Registers a factory. 
        // factoryType: Any string that identifies a specific factory type. Could be a value from rin.contracts.systemFactoryTypes or any unique string. 
        // providerTypeId: unique string that identifies a provider type.
        // factoryFunction: Function that return an instance of an object.
        // isSupportedCheckFunction: A function that takes version number as param and returns true if that version is supported.
        registerFactory: function (factoryType, providerTypeId, factoryFunction, isSupportedCheckFunction) {
            var factories = factoriesTypeMap[factoryType] || (factoriesTypeMap[factoryType] = []);
            factories.push({ providerTypeId: providerTypeId, factoryFunction: factoryFunction, isSupportedCheckFunction: isSupportedCheckFunction });
        },

        // Returns factory function for given factoryType string, providerTypeId string and optional version number.
        getFactory: function (factoryType, providerTypeId, version) {
            var factories = factoriesTypeMap[factoryType];
            if (!factories) return null;

            for (var i = factories.length - 1; i >= 0; i--) { 
                var factory = factories[i];
                if (factory.providerTypeId == providerTypeId) {
                    if (!version || typeof (factory.isSupportedCheckFunction) != "function" || factory.isSupportedCheckFunction(version)) return factory.factoryFunction;
                }
            }

            return factories[defaultFactoryProviderId];
        },

        // Sets default factory function for a given factory type. If no factory funtion is found for a given providerTypeId, this default factory is used.
        setDefaultFactory: function (factoryType, defaultFactoryFunction) {
            var factories = factoriesTypeMap[factoryType] || (factoriesTypeMap[factoryType] = []);
            factories[defaultFactoryProviderId] = defaultFactoryFunction;
        }
    };
})();