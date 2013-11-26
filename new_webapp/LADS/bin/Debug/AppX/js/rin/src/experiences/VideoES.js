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
    // ES for playing video clips.
    var VideoES = function (orchestrator, esData) {
        VideoES.parentConstructor.apply(this, arguments);
        var self = this;
        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(VideoES.elementHTML).firstChild;
        this._video = this._userInterfaceControl;
        this._esData = esData;

        this._url = orchestrator.getResourceResolver().resolveResource(esData.resourceReferences[0].resourceId, esData.experienceId);

        // Handle any interaction on the video and pause the player.
        $(this._userInterfaceControl).bind("mousedown", function (e) {
            self._orchestrator.pause();
        });
    };

    rin.util.extend(rin.contracts.DiscreteKeyframeESBase, VideoES);

    VideoES.prototypeOverrides = {
        // Load and initialize the video.
        load: function (experienceStreamId) {
            // Call load on parent to init the keyframes.
            VideoES.parentPrototype.load.call(this, experienceStreamId);
            if (!this._url) throw new Error("Video source not found!");

            var isIOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
            if (isIOS) {
                this._orchestrator.eventLogger.logErrorEvent("Video is not supported in safari since it cannot be programmatically started. Disabling video ES: " + experienceStreamId);
                this._userInterfaceControl.innerHTML = "";
                this.setState(rin.contracts.experienceStreamState.error);
                return;
            }

            var self = this;

            // Load any video trim data.
            if (self._esData.data.markers) {
                self._startMarker = self._esData.data.markers.beginAt;
            }

            // Set to buffering till the load is complete.
            this.setState(rin.contracts.experienceStreamState.buffering);
            rin.internal.debug.write("Load called for " + this._url);

            // Handle any errors while loading the video.
            this._video.onerror = function (error) {
                var errorString = "Video failed to load. Error: " + (self._video.error ? self._video.error.code : error) + "<br/>Url: " + self._url;
                var esInfo = self._orchestrator.debugOnlyGetESItemInfo();
                if (esInfo) {
                    errorString += "<br/>ES Info: {0}:{1} <br/>Lifetime {2}-{3}".rinFormat(esInfo.providerName, esInfo.id,
                    esInfo.beginOffset, esInfo.endOffset);
                }
                self._orchestrator.eventLogger.logErrorEvent(errorString);
                self.setState(rin.contracts.experienceStreamState.error);
            };

            // Handle load complete of the video.
            this._video.oncanplay = function () {
                rin.internal.debug.write("oncanplay called from " + self._url);
                if (self._desiredVideoPositon >= 0 && Math.abs(self._video.currentTime * 1000 - self._desiredVideoPositon) > 10) {
                    self._seek(self._desiredVideoPositon);
                    self._desiredVideoPositon = -1;
                }
            };

            // Handle ready state change and change the ES state accordingly.
            this._video.onreadystatechange = function (args) {
                var state = self._video.state();
                self.readyStateCheck();
            };

            // Constantly check for the state of the video to mointor buffering start and stop.
            this.readyStateCheck = function () {
                var state = self.getState();

                if (state === rin.contracts.experienceStreamState.ready || state === rin.contracts.experienceStreamState.error) return;

                if (self._video.readyState === self.CONST_READY_STATE) {
                    self.setState(rin.contracts.experienceStreamState.ready);
                }
                else {
                    self.setState(rin.contracts.experienceStreamState.buffering);
                    setTimeout(self.readyStateCheck, 500);
                }
            };

            // set video source
            var baseUrl = (this._url.substr(0, this._url.lastIndexOf('.')) || this._url) + ".";
            for (var i = 0; i < this._supportedFormats.length; i++) {
                var srcElement = document.createElement("source");
                srcElement.setAttribute("type", this._supportedFormats[i].type);
                srcElement.setAttribute("src", baseUrl + this._supportedFormats[i].ext);
                this._video.appendChild(srcElement);
            }

            this.readyStateCheck();
        },
        // Unload the video.
        unload: function () {
            try {
                this._video.pause();
                var srcElements = this._video.getElementsByTagName("source");
                for (var i = srcElements.length - 1; i >= 0; i--) {
                    var srcElement = srcElements[i];
                    srcElement.parentNode.removeChild(srcElement);
                }
                this._video.removeAttribute("src");
                this._video.load(); //As per Best practices  - http://dev.w3.org/html5/spec-author-view/video.html#best-practices-for-authors-using-media-elements
            }
            catch (e) {
                rin.internal.debug.assert(!e);
            }
        },
        // Play the video.
        play: function (offset, experienceStreamId) {
            try {
                var epsilon = 0.05; // Ignore minute seeks.
                if (Math.abs(this._video.currentTime - (this._startMarker + offset)) > epsilon) {
                    this._seek(offset, experienceStreamId);
                }
                this._updateMute();
                this._video.play();
            } catch (e) { rin.internal.debug.assert(false, "exception at video element " + e.Message); }
        },
        // Pause the video.
        pause: function (offset, experienceStreamId) {
            try {
                var epsilon = 0.05; // Ignore minute seeks.
                if (Math.abs(this._video.currentTime - (this._startMarker + offset)) > epsilon) {
                    this._seek(offset, experienceStreamId);
                }
                this._video.pause();
            } catch (e) { rin.internal.debug.assert(false, "exception at video element " + e.Message); }
        },
        // Set the base volume for the ES. This will get multiplied with the keyframed volume to get to the final applied volume.
        setVolume: function (baseVolume) {
            this._baseVolume = baseVolume;
            this._video.volume = this._baseVolume * this._getKeyframeVolume(this._lastKeyframe);
        },
        // Mute or Unmute the audio.
        setIsMuted: function (value) {
            this._updateMute();
        },

        onESEvent: function (sender, eventId, eventData) {
            if (eventId === rin.contracts.esEventIds.playerConfigurationChanged) {
                this._updateMute();
            }
            else if (eventId === rin.contracts.esEventIds.popupDisplayEvent) {
                this._updateMute();
            }
        },

        // Handle seeking of video.
        _seek: function (offset, experienceStreamId) {
            offset += this._startMarker;

            // See if the video element is ready.
            if (this._video.readyState === this.CONST_READY_STATE) {

                // In IE, video cannot seek before its initialTime. This property doesn't exist in Chrome.
                if (this._video.initialTime) {
                    offset = Math.max(offset, this._video.initialTime);
                }

                // See if we can seek to the specified offset.
                if (this._video.seekable) {
                    for (var i = 0; i < this._video.seekable.length; i++) {
                        if (this._video.seekable.start(i) <= offset && offset <= this._video.seekable.end(i)) {
                            this._video.currentTime = offset;
                            return;
                        }
                    }
                }
                this._desiredVideoPositon = offset;
            }
            else {
                this._desiredVideoPositon = offset;
            }
        },
        _getKeyframeVolume: function (keyframe) {
            if (keyframe && keyframe.state && keyframe.state.sound) {
                return keyframe.state.sound.volume;
            }
            else if (keyframe && keyframe.data && keyframe.data["default"]) {
                var data = rin.internal.XElement(keyframeData.data["default"]);
                if (data) return parseFloat(curData.attributeValue("Volume"));
            }
            return 1;
        },
        _setAudioVolume: function (value) {
            var volume = Math.min(1, Math.max(0, value) * this._baseVolume);
            this._video.volume = volume;
        },
        _updateMute: function () {
            var playerConfiguration = this._orchestrator.getPlayerConfiguration();
            this._video.muted = playerConfiguration.isMuted || this._orchestrator.activePopup;
        },
        CONST_READY_STATE: 4,
        _desiredVideoPositon: -1, // Seek location in case the video is not buffered or loaded yet at the location.
        _url: null,
        _baseVolume: 1, // Volume from orchestrator.
        _startMarker: 0, // Start trim position for the video.
        _interactionControls: null,
        // List of formats supported by the ES. Browser will pick the first one which it supports.
        // All the below sources are added to the Video tag irrespective of the source file format.
        _supportedFormats : [
            { ext: "webm", type: "video/webm" },
            { ext: "mp4", type: "video/mp4" },
            { ext: "ogv", type: "video/ogg; codecs=\"theora, vorbis\"" }
        ]
    };

    VideoES.elementHTML = "<video style='height:100%;width:100%;position:absolute' preload='auto'>Sorry, Your browser does not support HTML5 video.</video>";
    rin.util.overrideProperties(VideoES.prototypeOverrides, VideoES.prototype);
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.VideoExperienceStream", function (orchestrator, esData) { return new VideoES(orchestrator, esData); });
})(rin);
