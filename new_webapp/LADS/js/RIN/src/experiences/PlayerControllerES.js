/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../core/Common.js"/>
/// <reference path="../core/TaskTimer.js"/>
/// <reference path="../core/ESItem.js"/>
/// <reference path="../core/ESTimer.js"/>
/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="../contracts/IOrchestrator.js"/>
/// <reference path="../core/ScreenPlayInterpreter.js"/>
/// <reference path="../core/Orchestrator.js"/>
/// <reference path="../core/ESItemsManager.js"/>
/// <reference path="../core/EventLogger.js"/>
/// <reference path="../player/DefaultController.js" />
/// <reference path="../player/ControllerViewModel.js"/>

window.rin = window.rin || {};

rin.internal.PlayerControllerES = function () {
    "use strict";
    this.stateChangedEvent = new rin.contracts.Event();
};

rin.internal.PlayerControllerES.prototype = {
    isSystemES: true,
    orchestrator: null,
    _playerController: null,
    _playerControllerViewModel: null,

    initialize: function (playerElement, playerConfiguration) {
        "use strict";
        var self = this,
            stageElement,
            playPauseVM,
            seekerVM,
            volumeVM,
            troubleshootVM,
            playerControllerControl,
            onNarrativeLoaded = function () {
                var systemRoot = self.orchestrator.getResourceResolver().resolveSystemResource("");
                self._playerControllerViewModel.initialize();
                rin.defLoader = rin.defLoader || new rin.internal.DeferredLoader();
                rin.defLoader.loadAllThemeResources(systemRoot).then(function () {
                    self._playerController = new rin.internal.ui.DefaultController(self._playerControllerViewModel);

                    //Hide the seeker if the narrative duration is 0 or not available
                    if (!self.orchestrator.getNarrativeInfo().totalDuration) {
                        self._playerControllerViewModel.isSeekerVisible(false);
                        self._playerControllerViewModel.isPlayPauseVisible(false);
                        self._playerControllerViewModel.isVolumeVisible(false);
                    }

                    self._playerController.initStageArea(self.playerControl.getStageControl(), self.playerControl.getPlayerRoot());
                    playerControllerControl = self._playerController.getUIControl();
                    self._playerController.volumeChangedEvent.subscribe(function (value) {
                        volumeVM.setVolumeInPercent(value);
                    });
                    self._playerController.seekTimeChangedEvent.subscribe(function (value) {
                        seekerVM.setSeekPositionPercent(value);
                    });
                    self._playerController.showControlsEvent.subscribe(function () {
                        self._playerControllerViewModel.showFooterControls(true);
                    });
                    self._playerController.hideControlsEvent.subscribe(function () {
                        if (self.orchestrator.getPlayerState() !== rin.contracts.playerState.pausedForExplore) {
                            if (playPauseVM.isPlaying()) {
                                self._playerControllerViewModel.showFooterControls(false);
                            }
                        }
                    });
                    self._playerController.showHideTroubleShootingControls.subscribe(function (isShow) {
                        self._playerControllerViewModel.changeTroubleShootControlsVisibilty(isShow);
                    });
                    self._playerControllerViewModel.troubleShooterVM.startSeekPositionUpdater();
                    self._playerControllerViewModel.seekerVM.startSeekPositionUpdater();
                });
            };

        stageElement = document.createElement("div");
        stageElement.style.position = "relative";
        stageElement.style.width = "100%";
        stageElement.style.height = "100%";

        this.playerControl = new rin.internal.PlayerControl(stageElement, playerConfiguration, playerElement);
        this.orchestrator = this.playerControl.orchestrator;
        this._playerControllerViewModel = new rin.internal.PlayerControllerViewModel(this.orchestrator, this.playerControl);
        playPauseVM = this._playerControllerViewModel.playPauseVM;
        seekerVM = this._playerControllerViewModel.seekerVM;
        volumeVM = this._playerControllerViewModel.volumeVM;
        troubleshootVM = this._playerControllerViewModel.troubleShooterVM;

        this.orchestrator.narrativeLoadedEvent.subscribe(onNarrativeLoaded, null, this);
        this._playerControllerViewModel.interactionControls.subscribe(function () {
            var interactionControls = self._playerControllerViewModel.interactionControls();
            self._playerController.setInteractionControls(interactionControls);
        });

    },
    load: function (experienceStreamId) {
        "use strict";
    },
    play: function (offset, experienceStreamId) {
        "use strict";
        this._playerControllerViewModel.playPauseVM.isPlaying(true);
    },
    pause: function (offset, experienceStreamId) {
        "use strict";
        this._playerControllerViewModel.playPauseVM.isPlaying(false);
    },
    unload: function () {
        "use strict";
        this._playerControllerViewModel.seekerVM.stopSeekPositionUpdater();
        this._playerControllerViewModel.troubleShooterVM.stopSeekPositionUpdater();
    },
    getState: function () {
        "use strict";
        return rin.contracts.experienceStreamState.ready;
    },
    stateChangedEvent: null,
    getUserInterfaceControl: function () {
        "use strict";
        return null;
    },
    getControllerVM: function () {
        "use strict";
        return this._playerControllerViewModel;
    },
    playerControl: null
};