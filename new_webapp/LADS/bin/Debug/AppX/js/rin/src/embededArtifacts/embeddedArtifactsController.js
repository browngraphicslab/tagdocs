window.rin = window.rin || {};
rin.embeddedArtifacts = rin.embeddedArtifacts || {}

// Module to help with loading artifact visuals
rin.embeddedArtifacts.embeddedArtifactsController = function (orchestrator) {
    var self = this;

    orchestrator.currentESItemsChanged.subscribe(function (changeData) {
        if (changeData.removedItems)
            for (var i = 0; i < changeData.removedItems.length; i++) {
                var esInfo = changeData.removedItems[i];
                if (!esInfo || !esInfo.experienceStream) continue;
                if (!esInfo.esData || !esInfo.esData.data.EmbeddedArtifacts) continue;
                if (esInfo.embeddedArtifacts && esInfo.embeddedArtifacts == null) continue;

                self.removeEAComponents(esInfo);
            }

        if (changeData.addedItems)
            for (var i = 0; i < changeData.addedItems.length; i++) {
                var esInfo = changeData.addedItems[i];
                if (!esInfo || !esInfo.experienceStream || !esInfo.experienceStream.getEmbeddedArtifactsProxy) continue;
                if (!esInfo.esData.data.EmbeddedArtifacts) continue;
                if (esInfo.embeddedArtifacts && esInfo.embeddedArtifacts != null) continue;

                self.addEAComponents(esInfo);
            }
    }, "eaController");

    this.unload = function () {
        var currentItems = orchestrator.getCurrentESItems();
        if (currentItems)
            for (var i = 0; i < currentItems.length; i++) {
                var esInfo = currentItems[i];
                if (!esInfo || !esInfo.experienceStream) continue;
                if (!esInfo.esData || !esInfo.esData.data.EmbeddedArtifacts) continue;
                if (esInfo.embeddedArtifacts && esInfo.embeddedArtifacts == null) continue;

                self.removeEAComponents(esInfo);
            }
    };

    function createDataCollection(a, id) {
        var collection = {
            collectionId: id,
            forEach: function (func) {
                a.forEach(function (val, index) {
                    func(val, val["id"], collection);
                });
            }
        };
        return collection;
    };

    var testEngineHelper = {
        newGroupPolicy: function (policyId, collection, provider) {
            return rin.embeddedArtifacts.newDefaultGroupPolicy(policyId, collection, provider, orchestrator);
        },
    };

    this.addEAComponents = function (esInfo) {
        var le = rin.embeddedArtifacts.newLayoutEngine(testEngineHelper, orchestrator);
        esInfo.embeddedArtifacts = { "layoutEngine": le, "host": null, "updateLoopTimerID": null };

        // Download EA data from the specified source.
        var downloadHelper = new rin.internal.AjaxDownloadHelper(
            orchestrator.getResourceResolver().resolveResource(esInfo.esData.data.EmbeddedArtifacts.datasource));
        downloadHelper.getContent(function (eaData) {
            var eaJsonData = JSON.parse(eaData);
            var testCollection = createDataCollection(eaJsonData, "eaDataCollection");

            function loadEAComponents() {
                // Below loop is to ensure that any layout changes in EA visuals are applied even if the ES dosent call render().
                function updateLoop() {

                    rin.internal.debug.assert(orchestrator.getIsOnStage(esInfo.experienceStream));
                    le.render({});
                };
                if (esInfo.experienceStream.getState() == "ready") { // TODO: may need to use a better approach to make sure the code inside runs only after the ES is loaded.
                    // TODO: passing layout engine to ES proxy might not be the best but to avoid creating another event, im using this method for now.
                    var providerProxy = esInfo.experienceStream.getEmbeddedArtifactsProxy(le); // ES needs to call le.render({}) anytime the ES updates itself.
                    var eaContainer = providerProxy.getEmbeddedArtifactsContainer();

                    // Remove any existing EA host. This is a workaround as many times remove components is not getting called and the host remains in the DOM.
                    // This happens only when a deepstate link is used from inside RIN.

                    var existingHost = eaContainer.getElementsByClassName("rinDefault2DHost");
                    if (existingHost.length > 0)
                        eaContainer.removeChild(existingHost[0]);

                    var host = new rin.embeddedArtifacts.ArtifactHost(eaContainer,
                        new rin.internal.OrchestratorProxy(orchestrator));
                    esInfo.embeddedArtifacts.host = host;

                    // Hide EAs while the narrative is playing if configured to do so.
                    if (esInfo.esData.data.EmbeddedArtifacts.hideDuringPlay && esInfo.esData.data.EmbeddedArtifacts.hideDuringPlay == true) {
                        // Check current status and update the host.
                        if (orchestrator.getPlayerState() == rin.contracts.playerState.playing)
                            host.hide();

                        // Monitor status changes and update the host.
                        orchestrator.playerStateChangedEvent.subscribe(function (state) {
                            if (state.currentState == rin.contracts.playerState.pausedForExplore)
                                host.show();
                            else if (state.currentState == rin.contracts.playerState.playing)
                                host.hide();
                        }, esInfo.id);

                        // Hide EAs on transition events
                        orchestrator.playerESEvent.subscribe(function (state) {
                            if (state && state.eventId == rin.contracts.esEventIds.resumeTransitionEvent &&
                                state.sender._esData.experienceId == esInfo.experienceId) {
                                if (state.eventData.transitionState == "started")
                                    host.hide();
                                else if (state.eventData.transitionState == "interrupted")
                                    host.show();
                            }
                        }, esInfo.id);
                    }

                    le.addPipeline(testCollection, esInfo.esData.data.EmbeddedArtifacts.policies, providerProxy, host);
                    esInfo.embeddedArtifacts.updateLoopTimerID = setInterval(updateLoop, 500);
                }
                else if (esInfo.experienceStream.getState() != "error") {
                    setTimeout(loadEAComponents, 500);
                }
            }
            loadEAComponents();
        });
    };

    this.removeEAComponents = function (esInfo) {
        if (esInfo && esInfo.embeddedArtifacts && esInfo.embeddedArtifacts.host) {
            clearInterval(esInfo.embeddedArtifacts.updateLoopTimerID);
            orchestrator.playerStateChangedEvent.unsubscribe(esInfo.id);
            orchestrator.playerESEvent.unsubscribe(esInfo.id);
            esInfo.embeddedArtifacts.host.removeAll(true);
            esInfo.embeddedArtifacts = null;
        }
    };
};