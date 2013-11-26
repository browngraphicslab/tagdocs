/// <reference path="../core/Common.js" />
/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

window.rin = window.rin || {};

rin.PopupControl = function (orchestrator) {
    this._orchestrator = orchestrator;

    var resourceResolver = this._orchestrator.getResourceResolver();
    //-- Download the relevant html and js files
    var htmlfile = resourceResolver.resolveSystemResource('popup/popup.htm');
    var jsfile = resourceResolver.resolveSystemResource('popup/popup.js');
    var _isHtmlLoaded, _isJsLoaded = false;
    var subscription = null;
    var self = this;

    var htmlDownload = {
        url: htmlfile,
        dataType: "html",
        error: function (jqxhr, textStatus, errorThrown) {
            popupViewModel.error(true);
            self._orchestrator.eventLogger.logErrorEvent("Error: {0} downloading html file: {1}", exception.Message, htmlfile);
        },
        success: function (data, textStatus, jqxhr) {
            self._elementHtml = data;
            _isHtmlLoaded = true;
            updateView();
        }
    };
    $.ajax(htmlDownload);

    $.getScript(jsfile)
    .done(function (script, textStatus) {
        _isJsLoaded = true;
        updateView();
    })
    .fail(function (jqxhr, settings, exception) {
        popupViewModel.error(true);
        self._orchestrator.eventLogger.logErrorEvent("Error: {0} downloading js file: {1}", exception.Message, jsfile);
    });

    //--External function to be called with experienceStreamData 
    //--and the datacontext(can be either a collectionViewModel or a plain collection Item)
    this.load = function (esData, dataContext) {
        this._orchestrator.getPlayerConfiguration().activePopup = this; //TODO: Post everest, find better place to store this kind of information instead of playerConfiguration.
        populateViewModel(esData, dataContext);
        updateView();
    }

    this.hasAudio = false;

    //--Triggers a onclose event callback when the popup control closes.
    //--CB uses this to assess the mode it is currently in
    var close = function () {
        if (self._userInterfaceControl) {
            self._popupControl.close(function () {
                if (self._playerControl != null) {
                    self._playerControl.pause();
                    self._playerControl.unload();
                }

                $(self._userInterfaceControl).remove();
                $(self).trigger('onclose', null);

                self._orchestrator.getPlayerConfiguration().activePopup = null;
                self._orchestrator.onESEvent(rin.contracts.esEventIds.popupDisplayEvent, { displayed: false, hasAudio: self.hasAudio });
            }, self);
        }
        //-- Dispose the subscription created for CurrentItem change in a collection mode
        if (subscription) {
            subscription.dispose();
        }
    }

    //--Update the ESData and the view when the current Item changes
    var onCurrentItemChange = function (newValue) {
        popupViewModel.esData = newValue.esData;
        updateView();
    }

    //Dummy popupview model, that can be extended 
    //based on the current datacontext 
    //(either with a collection data model in case of CB or a single item incase of Overlays)
    var popupViewModel = {
        esData: {},
        currentItem: ko.observable({}),
        isESLoading: ko.observable(false),
        onViewClose: function () {
            close();
        },
        error: ko.observable(false),
        init: function () {
            popupViewModel.error(false);
            popupViewModel.currentItem({});
        }
    }

    var populateViewModel = function (esData, dataContext) {
        popupViewModel.init();
        //-- if there is a collection just copy the data context items over to our viewmodel
        if (dataContext && dataContext.currentItem) {
            rin.util.overrideProperties(dataContext, popupViewModel);
        }//--its a single item
        else if (dataContext) {
            popupViewModel.currentItem(dataContext);
        }
        //--the current esData
        popupViewModel.esData = esData;
        self.hasAudio = !!dataContext.hasAudio;
        subscription = popupViewModel.currentItem.subscribe(onCurrentItemChange);
    }

    var updateView = function () {
        //Once html, javascript and viewmodel is loaded
        //create and load the view and show the experiencestream
        if (_isHtmlLoaded && _isJsLoaded && popupViewModel.esData) {
            var playerControl = $(".rin_mainContainer", self._orchestrator.getPlayerRootControl());

            if (self._userInterfaceControl === undefined) {
                self._userInterfaceControl = rin.util.createElementWithHtml(self._elementHtml).firstChild;
                playerControl.append(self._userInterfaceControl);
            }

            //--loads the popup and shows the new ES
            if (self._popupControl === undefined) {
                //-- clones the play pause controls, right side fb/volume controls from player and shows it up
                self._popupControl = new rin.PopupControl.View(self._userInterfaceControl, playerControl.width(), playerControl.height(), popupViewModel.esData.data.narrativeData.aspectRatio);

                ko.applyBindings(popupViewModel, self._userInterfaceControl);
                self._popupControl.showES(getPlayerControl(), null);
            }
            else {
                //--Hides the old ES and shows the new one
                self._popupControl.hideES(function () {
                    self._popupControl.showES(getPlayerControl(), null);
                });
            }

            self._orchestrator.onESEvent(rin.contracts.esEventIds.popupDisplayEvent, { displayed: true, hasAudio: self.hasAudio });
        }
    }

    var getPlayerControl = function () {
        var narrativeData = popupViewModel.esData;
        var playerElement = rin.util.createElementWithHtml("<div style='width:100%;height:100%'></div>");
        var configuration = rin.util.shallowCopy(orchestrator.getPlayerConfiguration());

        configuration.narrativeRootUrl = "";
        configuration.hideAllControllers = false;
        configuration.controls = true;
        configuration.controllerOptions = {
            header: false,
            playPause: true,
            share: false,
            fullscreen: false,
            seeker: true,
            volume: true,
            seekToBeginningOnEnd: true
        };
        if (typeof popupViewModel.currentItem.rootUrl === "string")
            configuration.narrativeRootUrl = popupViewModel.currentItem.rootUrl;
        self._playerControl = rin.createPlayerControl(playerElement.firstChild, configuration);
        self._playerControl.loadData(narrativeData, function () {
            self._playerControl.play();
        });
        self._playerControl.muteChangedEvent.subscribe(function (value) {
            orchestrator.getPlayerControl().mute(value);
        });

        return playerElement.firstChild;
    }
};