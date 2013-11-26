/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../contracts/IExperienceStream.js" />

(function (rin) {
    // Behavior for expanding a overlay to fullscreen.
    var PopupBehavior = function (orchestrator) {
        this.orchestrator = orchestrator;

        // Execute this behavior on the assigned target.
        this.executeBehavior = function (behaviorArgs, completionCallback) {
            if (this.orchestrator.getPlayerConfiguration().activePopup) return; // we already have an active popup open. Cannot show another popup till other one is closed.
            var dataContext = behaviorArgs.DataContext;
            this.getItemESData(dataContext);
            var popup = new rin.PopupControl(this.orchestrator);
            popup.load(dataContext.esData, dataContext);

            $(popup).bind('onclose', function (e) {
                if (typeof (completionCallback) === 'function')
                    completionCallback();
            });
        };

        this.getItemESData = function (itemData) {
            if (itemData.esData === undefined) {
                itemData.esData = rin.internal.esDataGenerator.getExperienceStream(itemData);
            }
        };
    };

    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.behaviorFactory, "MicrosoftResearch.Rin.Behaviors.Popup",
        function (orchestrator) {
            return new PopupBehavior(orchestrator);
        });
})(window.rin);