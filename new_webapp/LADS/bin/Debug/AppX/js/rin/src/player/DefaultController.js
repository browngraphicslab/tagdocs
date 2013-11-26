/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../contracts/IExperienceStream.js"/>
/// <reference path="../core/Common.js"/>
/// <reference path="../core/ESItem.js"/>
/// <reference path="../core/EventLogger.js"/>
/// <reference path="../core/Orchestrator.js"/>
/// <reference path="../core/PlayerConfiguration.js"/>
/// <reference path="../core/PlayerControl.js"/>
/// <reference path="../core/ResourcesResolver.js"/>
/// <reference path="../core/RinDataProxy.js"/>
/// <reference path="../core/ScreenPlayInterpreter.js"/>
/// <reference path="../core/StageAreaManager.js"/>
/// <reference path="../core/TaskTimer.js"/>
/// <reference path="../player/ControllerViewModel.js"/>

window.rin = window.rin || {};
window.rin.internal = window.rin.internal || {};
rin.internal.ui = rin.internal.ui || {};

rin.internal.ui.DefaultController = function (viewModel) {
    var self = this,
        playerControllerElement = null,
        playerControllerElementHtml = null,
        stageControl = null,
        interactionControlsWrap = null,
        playPauseControl,
        volumeControl,
        timelineControl,
        loopControl,
        troubleShooterControl,
        createChildControls = function () {
            var playPauseUIControl = $(".rin_PlayPauseContainer", playerControllerElement),
                volumeUIControl = $(".rin_VolumeControl", playerControllerElement),
                timelineUIControl = $(".rin_TimelineHolder", playerControllerElement),
                loopUIControl = $(".rin_LoopControl", playerControllerElement),
                troubleShooterUIControl = $(".rin_TroubleShooterControlHolder", playerControllerElement),
                startExploringUIControl = $(".rin_startExploring", playerControllerElement);

            playPauseControl = new rin.internal.ui.PlayPauseControl(playPauseUIControl, viewModel.playPauseVM);
            volumeControl = new rin.internal.ui.VolumeControl(volumeUIControl, viewModel.volumeVM);
            timelineControl = new rin.internal.ui.SeekerControl(timelineUIControl, viewModel.seekerVM);
            loopControl = new rin.internal.ui.LoopControl(loopUIControl, viewModel.loopVM);
            troubleShooterControl = new rin.internal.ui.TroubleShootingControl(troubleShooterUIControl, playerControllerElement, interactionControlsWrap, viewModel.troubleShooterVM);
            startExploringControl = new rin.internal.ui.StartExploringControl(startExploringUIControl, viewModel);

            volumeControl.volumeChangedEvent.subscribe(function (value) {
                self.volumeChangedEvent.publish(value);
            });
            timelineControl.seekTimeChangedEvent.subscribe(function (value) {
                self.seekTimeChangedEvent.publish(value);
            });
        },
        hookEvents = function () {
            var CONST_CONTROL_TIMER_MS = 5000,
                controlTimerId,
                resetControlTimer = function (timerId, onTimeOut) {
                    timerId && clearTimeout(timerId);
                    timerId = setTimeout(onTimeOut, CONST_CONTROL_TIMER_MS);
                    return timerId;
                };

            var onShowControls = function () {
                self.showControlsEvent.publish();
                controlTimerId = resetControlTimer(controlTimerId, function () {
                    self.hideControlsEvent.publish();
                    volumeControl && volumeControl.volumeSlider.hideSlider();
                });
            };

            /*Custom Events Start*/
            playerControllerElement.bind("showHideTroubleShootingControls", function (type, isShow) {
                self.showHideTroubleShootingControls.publish(isShow);
            });
            /*Custom Events End*/

            playerControllerElement.mousemove(function (event) {
                onShowControls();
            });
            playerControllerElement.mouseover(function (event) {
                onShowControls();
            });
        };

    //******************************Exposed as Public Members Start ********************************/
    this.showControlsEvent = new rin.contracts.Event();
    this.hideControlsEvent = new rin.contracts.Event();
    this.volumeChangedEvent = new rin.contracts.Event();
    this.seekTimeChangedEvent = new rin.contracts.Event();
    this.showHideTroubleShootingControls = new rin.contracts.Event();

    this.isSystemES = true;
    this.initStageArea = function (stageElement, playerRoot) {
        ko.renderTemplate("Controller.tmpl", viewModel, null, playerRoot);
        playerControllerElement = $(".rin_mainContainer", playerRoot);
        stageControl = $(".rin_ExperienceStream", playerControllerElement);
        stageControl.append(stageElement);

        // Disable event propogation
        var cancelTouch = function (e) {
            e.stopPropagation();
            e.cancelBubble = true;
        }
        // Disable touch events so that on IE 10 RT the browser will not switch to the next tab on a horizontal swipe.
        stageElement.addEventListener("MSPointerDown MSPointerMove MSPointerUp", cancelTouch, false);

        interactionControlsWrap = $(".rin_InteractiveContainer", playerControllerElement);
        createChildControls();
        hookEvents();
    };

    this.setInteractionControls = function (controls) {
        interactionControlsWrap.children().detach();
        controls && interactionControlsWrap && interactionControlsWrap.append(controls);
    };

    this.getUIControl = function () {
        playerControllerElementHtml = playerControllerElementHtml || playerControllerElement[0];
        return playerControllerElementHtml;
    };
    this.setVM = function (viewModel) {
        ko.bindingHandlers.stopBinding = {
            init: function () {
                return { controlsDescendantBindings: true };
            }
        };
        ko.virtualElements.allowedBindings.stopBinding = true;
        ko.applyBindings(viewModel, this.getUIControl());
        playPauseControl.setVM(viewModel.playPauseVM);
        volumeControl.setVM(viewModel.volumeVM);
        timelineControl.setVM(viewModel.seekerVM);
        loopControl.setVM(viewModel.loopVM);
        troubleShooterControl.setVM(viewModel.troubleShooterVM);
    };
    //******************************Exposed as Public Members End ********************************/
};

rin.internal.ui.SliderBase = function (controlPlaceHolder, controlElement, isVertical, viewModel) {

    if (isVertical) {
        ko.renderTemplate('VerticalSliderControl.tmpl', viewModel, null, controlPlaceHolder.get(0));
    }
    else {
        ko.renderTemplate('HorizontalSliderControl.tmpl', viewModel, null, controlPlaceHolder.get(0));
    }

    var CONST_CONTROL_TIMER_MS = 1500,
        thumbSelected = false,
        self = this,
        controlTimerId,
        resetControlTimer = function (timerId, onTimeOut) {
            timerId && clearTimeout(timerId);
            timerId = setTimeout(onTimeOut, CONST_CONTROL_TIMER_MS);
            return timerId;
        };
    var isSliderVisible = false;

    this.sliderContainer = $(".rin_SliderContainer", controlPlaceHolder);
    this.slider = $(".rin_Slider", controlPlaceHolder);

    this.valueChangedEvent = new rin.contracts.Event();

    /* Custom Events*/
    this.showSlider = function (type, event) {
        self.sliderContainer.show();
        isVertical && controlPlaceHolder.show();//for volume slider
        isSliderVisible = true;
    };

    this.hideSlider = function (type, event) {
        self.sliderContainer.hide();
        isVertical && controlPlaceHolder.hide();//for volume slider
        isSliderVisible = false;
    };


    this.sliderContainer.bind("changeValue", function (type, event) {
        var sliderOffset = self.sliderContainer.offset(),
            sender = event.currentTarget,
            valueInPercent;
        if (isVertical) {
            valueInPercent = 100 - ((event.pageY - sliderOffset.top) * 100 / sender.clientHeight);
        }
        else {
            valueInPercent = (event.pageX - sliderOffset.left) * 100 / sender.clientWidth;
        }
        self.valueChangedEvent.publish(valueInPercent);
        event.preventDefault();
        event.stopPropagation();
    });
    /* Custom Events*/
    controlPlaceHolder.mouseover(function (event) {
        controlTimerId && clearTimeout(controlTimerId);
        self.showSlider();
    });

    this.sliderContainer.mousemove(function (event) {
        if (thumbSelected) {
            self.sliderContainer.trigger("changeValue", event);
        }
        event.preventDefault();
    });

    this.sliderContainer.mouseup(function (event) {        
        if (thumbSelected) {
            self.sliderContainer.trigger("changeValue", event);
            thumbSelected = false;
        }
    });

    this.sliderContainer.mousedown(function (event) {        
        thumbSelected = true;
        self.sliderContainer.trigger("changeValue", event);
    });

    this.sliderContainer.mouseleave(function (event) {
        thumbSelected = false;
    });

    if (controlElement) {
        //If a controlling element is passed, then the slider is to be shown only on its hover
        //like a volume control

        controlElement.mouseover(function (event) {
            controlTimerId && clearTimeout(controlTimerId);
            self.showSlider();
        });

        controlPlaceHolder.mouseleave(function (event) {
            controlTimerId = resetControlTimer(controlTimerId, function () {
                self.hideSlider();
            });
        });

        controlElement.mouseleave(function (event) {
            controlTimerId = resetControlTimer(controlTimerId, function () {
                self.hideSlider();
            });
        });

        this.hideSlider();
    }
};

rin.internal.ui.VerticalSlider = function (controlPlaceHolder, controlElement, viewModel) {
    return new rin.internal.ui.SliderBase(controlPlaceHolder, controlElement, true, viewModel);
};

rin.internal.ui.HorizontalSlider = function (controlPlaceHolder, controlElement, viewModel) {
    return new rin.internal.ui.SliderBase(controlPlaceHolder, controlElement, false, viewModel);
};

rin.internal.ui.PlayPauseControl = function (control, viewModel) {
    ko.renderTemplate('PlayPauseControl.tmpl', viewModel, null, control.get(0));
    this.setVM = function (viewModel) {
        ko.applyBindings(viewModel, control.get(0));
    }
};

rin.internal.ui.VolumeControl = function (control, viewModel) {
    ko.renderTemplate('VolumeControl.tmpl', viewModel, null, control.get(0));

    var volumeControlSlider = $(".rin_VolumeSliderPlaceHolder", control),
        volumeButton = $(".rin_Button", control),
        self = this;

    this.volumeSlider = new rin.internal.ui.VerticalSlider(volumeControlSlider, volumeButton, viewModel);
    this.volumeChangedEvent = rin.contracts.Event();
    this.volumeSlider.valueChangedEvent.subscribe(function (value) {
        self.volumeChangedEvent.publish(value);
    });
    this.setVM = function (viewModel) {
        ko.applyBindings(viewModel, control.get(0));
    };
};

rin.internal.ui.SeekerControl = function (control, viewModel) {
    var self = this;
    this.timelineSlider = new rin.internal.ui.HorizontalSlider(control, null, viewModel);
    this.seekTimeChangedEvent = rin.contracts.Event();
    if (control[0].children[0]) {
        var slider = $(control[0].children[0]);
        slider.mousemove(function (evt) {
            viewModel.setHoverValue(evt.offsetX / slider.width());
        });
    }
    this.timelineSlider.valueChangedEvent.subscribe(function (value) {
        self.seekTimeChangedEvent.publish(value);
    });
    this.setVM = function (viewModel) {
        ko.applyBindings(viewModel, control.get(0));
    };
};

rin.internal.ui.LoopControl = function (control, viewModel) { //////////////////////////////////////////////TODO:Loop function
    ko.renderTemplate('LoopControl.tmpl', viewModel, null, control.get(0));

    //var playerResizeEvent = document.createEvent('HTMLEvents');
    //playerResizeEvent.initEvent('resize', false, false);
    //playerResizeEvent.data = {};

    var self = this,
        button = $(".rin_Button", control),
        //control = $(htmlElement),
        isLoop = false;
    button.click(function (event) {
        isLoop = !isLoop;
        viewModel.setLoop(isLoop);
     });
    this.setVM = function (viewModel) {
        ko.applyBindings(viewModel, control.get(0));
    };
    //inFullScreenMode = function () {
    //    if (htmlElement.requestFullScreen)
    //        return document.fullscreenElement;
    //    if (htmlElement.mozRequestFullScreen)
    //        return document.mozFullScreen;
    //    if (htmlElement.webkitRequestFullScreen)
    //        return document.webkitIsFullScreen;
    //    return isFullScreen;
    //},
    //toggleFullScreen = function () {
    //    if (inFullScreenMode()) {
    //        if (document.exitFullscreen) {
    //            document.exitFullscreen();
    //        } else if (document.mozCancelFullScreen) {
    //            document.mozCancelFullScreen();
    //        } else if (document.webkitCancelFullScreen) {
    //            document.webkitCancelFullScreen();
    //        }
    //        else {
    //            htmlElement.removeEventListener('keydown', escListener, false);
    //            document.removeEventListener('keydown', escListener, false);
    //            isFullScreen = false;
    //        }
    //    }
    //    else {
    //        if (htmlElement.requestFullScreen) {
    //            htmlElement.requestFullScreen();
    //        } else if (htmlElement.mozRequestFullScreen) {
    //            htmlElement.mozRequestFullScreen();
    //        } else if (htmlElement.webkitRequestFullScreen) {
    //            htmlElement.webkitRequestFullScreen();
    //        }
    //        else {
    //            htmlElement.addEventListener('keydown', escListener, false);
    //            document.addEventListener('keydown', escListener, false);
    //            isFullScreen = true;
    //        }
    //    }
    //    toggleFullScreenResources();

    //    htmlElement.dispatchEvent(playerResizeEvent);
    //},
    //escListener = function (e) {
    //    if (e && e.keyCode && e.keyCode === 27) { toggleFullScreen(); }
    //},
    //toggleFullScreenResources = function (event) {
    //    if (inFullScreenMode()) {
    //        button.removeClass('rin_RestoreScreen');
    //        button.addClass('rin_FullScreen');
    //        var parent = control.parent();
    //        if (parent)
    //            parent.addClass('rin_FullScreenContent');
    //        else
    //            control.addClass('rin_FullScreenContent');
    //    }
    //    else {
    //        button.addClass('rin_RestoreScreen');
    //        button.removeClass('rin_FullScreen');
    //        var parent = control.parent();
    //        if (parent)
    //            parent.removeClass('rin_FullScreenContent');
    //        else
    //            control.removeClass('rin_FullScreenContent');
    //    }
    //};

    //document.addEventListener('fullscreenchange', toggleFullScreenResources, false);
    //document.addEventListener('mozfullscreenchange', toggleFullScreenResources, false);
    //document.addEventListener('webkitfullscreenchange', toggleFullScreenResources, false);

   
};

rin.internal.ui.TroubleShootingControl = function (controlRoot, controlParent, interactionControlsWrap, viewModel) {
    ko.renderTemplate('TroubleShooter.tmpl', viewModel, null, controlRoot.get(0));
    // todo: Gautham: Use RinEvents for communication between controls instead of jquery events
    controlParent.keydown(function (event) {
        if (
            ((event.key && event.key.toLowerCase() === "t") ||
             (event.keyCode && (event.keyCode === 84 || event.keyCode === 116)))
            && event.shiftKey) {
            controlParent.trigger("showHideTroubleShootingControls");
        }
        else if (
            ((event.key && event.key.toLowerCase() === "d") ||
             (event.keyCode && event.keyCode === 68 ))
            && event.shiftKey) {
            controlParent.trigger("showHideTroubleShootingControls", true);
            viewModel.showControls(true);
            viewModel.isHeaderVisible(true);
            viewModel.showdeepstateDialogClick();
            viewModel.captureDeepStateClick();
        }
    });
    viewModel.interactionEvent.subscribe(function () {
        var elements = $(":visible", interactionControlsWrap), elementsList, index, opCode;
        if (elements && elements.length) {
            elementsList = new rin.internal.List();
            for (index = 0; index < elements.length; index++) {
                elementsList.push($(elements[index]));
            }
            elementsList = elementsList.filter(function (item) {
                return item.data("events");
            });
            if (elementsList && elementsList.length) {
                opCode = rin.util.randInt(0, elementsList.length - 1);
                elementsList[opCode].trigger('click');
            }
        }
    });

    this.setVM = function (viewModel) {
        ko.applyBindings(viewModel, control);
    };
};

rin.internal.ui.StartExploringControl = function ($control, viewModel) {
    
    $control.on('click', function () {
         
        // enable interactive mode
        viewModel.startInteractionMode();

        // raise a custom jQuery event that can be subscribed to on the page
        $.event.trigger('rin.startExploring');

    });
};
