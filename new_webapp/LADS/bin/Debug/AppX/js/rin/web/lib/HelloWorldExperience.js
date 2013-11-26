/// <reference path="DiscreteKeyFrameBase.ts"/>

(function () {
    var HelloWorldExperienceProvider = (function () {
        function HelloWorldExperienceProvider(orchestrator, esData) {
            this.orchestrator = orchestrator;
            this.esData = esData;
            this._uiControl = convertToHtmlDom(ELEMENTHTML).firstChild;
        }
        // Load experience stream contents at the passed experienceStreamId
        HelloWorldExperienceProvider.prototype = {
            load: function (experienceStreamId) {
                var prevState = this._state;
                this._state = rin.contracts.experienceStreamState.ready;
                this.stateChangedEvent.publish(new rin.contracts.ESStateChangedEventArgs(prevState, this._state, this));
                this._uiControl.innerHTML = "Hello World. Experience Stream Id = " + experienceStreamId + " loaded";
            },
            // Play contents from the given offset & experienceStreamId
            play: function (offset, experienceStreamId) {
                this._uiControl.innerHTML = "Hello World. Experience Stream Id = " + experienceStreamId + " loaded" + "play called at " + offset;
                //Insert your code to play the experience stream.
            },
            // Pause experience stream with the first frame displayed at given offset & experienceStreamId
            pause: function (offset, experienceStreamId) {
                this._uiControl.innerHTML = "Hello World. Experience Stream Id = " + experienceStreamId + " loaded" + "pause called at " + offset;
                //Insert your code to pause the experience stream.
            },
            // Release all resources and unload
            unload: function () {
            },
            // Return current state - one of states listed in rin.contracts.experienceStreamState
            getState: function () {
                return this._state;
            },
            // Return html element that displays contents of this experience provider.
            getUserInterfaceControl: function () {
                return this._uiControl;
            },
            //One of the experience streams has raised an ESEvent. Take appropriate action (if any). <Optional>
            onESEvent: function (sender, eventId, eventData) {
                this._uiControl.innerHTML = "Hello World. EsEvent has been raised by an Experience Provider";
            },
            // Set the base volume. <Optional>
            setVolume: function (baseVolume) {
                this._uiControl.innerHTML = "Hello World. Setting the volume to " + baseVolume;
            },
            // Mute or unmute. <Optional>
            setIsMuted: function (value) {
                this._uiControl.innerHTML = "Hello World. Muting the volume";
            },

            orchestrator: null, //rin.OrchestratorProxy
            esData: null, //Object
            _uiControl: null //HTMLElement
        }
        return HelloWorldExperienceProvider;
    })();
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "HelloWorldExperienceProvider",
        function (orchestrator, esData) {
            return new HelloWorldExperienceProvider(orchestrator, esData);
        });
    //Helper
    var convertToHtmlDom = function (htmlString) {
        var div = document.createElement("div");
        div.innerHTML = htmlString;
        return div;
    };

    var ELEMENTHTML = '<span style="width:100%;height:20%;positiion:absolute"></span>';
}());
