/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/
/// <reference path="../core/Common.js" />
window.rin = window.rin || {};
//-- New Knockout binding to handle both tap and click.
ko.bindingHandlers.clickOrTouch = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        $(element).rinTouchGestures(function (e, touchGesture) {
            if (touchGesture.gesture == 'simpletap') {
                var handlerFunction = valueAccessor() || {};
                if (!handlerFunction)
                    return;
                try {
                    var argsForHandler = rin.util.makeArray(arguments);
                    argsForHandler.unshift(viewModel);
                    handlerFunction.apply(viewModel, argsForHandler);
                } finally { }
            }
        }, { simpleTap: true, swipe: false });
        return null;
    }
};

rin.ContentBrowserES = function (orchestrator, esData, dimension) {
    this._orchestrator = orchestrator;
    this._esData = esData;
    this._dimension = dimension;
    var resourceResolver = this._orchestrator.getResourceResolver();
    var htmlfile = resourceResolver.resolveSystemResource('contentbrowser/' + dimension + '.htm');
    var jsfile = resourceResolver.resolveSystemResource('contentbrowser/' + dimension + '.js');

    this._userInterfaceControl = document.createElement("div");
    this._userInterfaceControl.style.width = "100%";
    this._userInterfaceControl.style.height = "100%";
    this._userInterfaceControl.style.position = "absolute";

    var self = this;
    //--Download the theme based htm file
    var htmlDownload = {
        url: htmlfile,
        dataType: "html",
        error: function (jqxhr, textStatus, errorThrown) {
            self.setState(rin.contracts.experienceStreamState.error);
            self._orchestrator.eventLogger.logErrorEvent("Error: {0} downloading the html file: {1}", exception.Message, htmlfile);
        },
        success: function (data, textStatus, jqxhr) {
            self._elementHtml = data;
            self._isHtmlLoaded = true;
            self._updateView();
        }
    };
    $.ajax(htmlDownload);

    //--Download the js file associated with the current CB
    $.getScript(jsfile)
    .done(function (script, textStatus) {
        self._isJsLoaded = true;
        self._updateView();
    })
    .fail(function (jqxhr, settings, exception) {
        self.setState(rin.contracts.experienceStreamState.error);
        self._orchestrator.eventLogger.logErrorEvent("Error: {0} downloading the js file: {1}", exception.Message, jsfile);
    });

    var control = this._userInterfaceControl;
    var lastZIndex = 0;
    this._userInterfaceControl.hide = function () {
        lastZIndex = control.style.zIndex;
        control.style.zIndex = 0;
    }
    this._userInterfaceControl.unhide = function () {
        control.style.zIndex = lastZIndex;
        this._userInterfaceControl.opacity = 1;
    }
    this._collectionData = {};

    /* Disabling this for Everest as ImageES is used in the popup gallery. Todo Enable afterwards 
    //--Bind the mouseup to fire interaction event
    $(this._userInterfaceControl).bind("mouseup", function (e) {
        self._orchestrator.startInteractionMode();
    });*/
    //Set the initial state to buffering and load the 
    this.setState(rin.contracts.experienceStreamState.buffering);
    this._loadCollectionJSON();
};

rin.ContentBrowserES.prototype = new rin.contracts.DiscreteKeyframeESBase();
rin.ContentBrowserES.base = rin.contracts.DiscreteKeyframeESBase.prototype;
rin.ContentBrowserES.changeTrigger = { none: 0, onkeyframeapplied: 1, onnext: 2, onprevious: 3, onclick: 4 };
rin.ContentBrowserES.currentMode = { preview: 0, expanded: 1 };

rin.ContentBrowserES.prototypeOverrides = {
    load: function (experienceStreamId) {
        rin.ContentBrowserES.base.load.call(this, experienceStreamId);

        if (this._esData.data["default"] != undefined) {
            this._showFilmstripAlways = (new rin.internal.XElement(this._esData.data["default"]).elementValue("ShowFilmstripAlways", false) == "true");
            this._showDescriptionByDefault = (new rin.internal.XElement(this._esData.data["default"]).elementValue("ShowDescriptionByDefault", false) == "true");
        }
    },

    unload: function () {
        rin.ContentBrowserES.base.unload.call(this);
    },

    setDataContext: function (collectionData) {
        //--Bind the UI to the viewmodel
        if (collectionData.groupsList.length > 0) {
            this.collectionViewModel = this.getViewModel(collectionData, this._orchestrator);
            this._isJSONLoaded = true;
            this._updateView();
        }
    },

    getCapturedKeyframe: function (keyframeData) {
        if (typeof keyframeData != undefined) {
            return keyframeData;
        }
        return null;
    },

    displayKeyframe: function (keyframeData) {
        if (keyframeData != undefined) {
            var dataElement = keyframeData.data["kf-selstate"];
            if (dataElement != undefined) {
                this.goToState(dataElement);
            }
        }
    },

    captureKeyframe: function () {
        return JSON.parse('{"state" : { "kf-selstate": { "item": {"itemid": "{0}", "view": { "display": { "show": true } } } } } }'.rinFormat(this.collectionViewModel.currentItem().id));
    },
    addedToStage: function () {
    },

    removedFromStage: function () {
        // this._orchestrator.onESEvent(this, rin.contracts.esEventIds.showControls, null); //todo: investigate what needs to happen here. Do we really need showControls esEvent?
    },

    getCurrentState: function () { return null; },

    goToState: function (artifactState) {
        if (this.collectionViewModel === undefined || this.collectionViewModel == null)
            return;
        //--Get the group/item to be selected and call Applykeyframe on it.
        for (var item in artifactState) {
            var itemId = artifactState[item].itemid;
            var selectedItem = null;

            this.collectionViewModel.groups.foreach(function (group) {
                 selectedItem = group.itemsList.firstOrDefault(function (item) {
                    return item.id == itemId; });
            });

            if (selectedItem != null) {
               if (selectedItem && selectedItem.id !== this.collectionViewModel.currentItem().id) {
                   this.collectionViewModel.onApplyKeyframe(selectedItem);
               }
               break;
            }
        }
    },

    toggleDescription: function (isDescVisible) { },

    toggleFilmstrip: function (isFilmstripVisible) { },

    //--Populates the viewmodel
    getViewModel: function (collectionData, orchestrator) {
        var collectionViewModel = {
            orchestrator: orchestrator,
            title: collectionData.title, //collection title
            description: collectionData.description, //collection description
            groups: collectionData.groupsList, //--the groups list along with the items in it
            itemUpdateTrigger: rin.ContentBrowserES.changeTrigger.none,
            previousItem: {}, //--the item that was previously selected
            currentMode: rin.ContentBrowserES.currentMode.preview, //--current mode of CB - is it in expanded mode or preview
            currentItem: ko.observable({}), //--currently selected item
            isLastItem: ko.observable(false),
            isFirstItem: ko.observable(false),
            initViewModel: function () {
                if (this.groups.length > 0 && this.groups[0].itemsList.length > 0) {
                    this.currentItem(this.groups[0].itemsList[0]);
                    this.isFirstItem(true);
                }
            },
            onPrevious: function () {
                var groupIndex = self.currentItem().groupIndex;
                var index = self.groups[groupIndex].itemsList.indexOf(self.currentItem());
                self.beforeSelectionChange();

                if (index > 0) {
                    index--;
                }
                else if (index === 0 && groupIndex > 0) {
                    groupIndex--;
                    index = self.groups[groupIndex].itemsList.length - 1;
                }
                else
                    return;
                self.itemUpdateTrigger = rin.ContentBrowserES.changeTrigger.onprevious;
                self.afterSelectionChange(groupIndex, index);
            },
            onNext: function () {
                var groupIndex = self.currentItem().groupIndex;
                var index = self.groups[groupIndex].itemsList.indexOf(self.currentItem());
                self.beforeSelectionChange();

                if (index < self.groups[groupIndex].itemsList.length - 1) {
                    index++;
                }
                else if (index === (self.groups[groupIndex].itemsList.length - 1) && groupIndex < (self.groups.length - 1)) {
                    groupIndex++;
                    index = 0;
                }
                else
                    return;
                self.itemUpdateTrigger = rin.ContentBrowserES.changeTrigger.onnext;
                self.afterSelectionChange(groupIndex, index);
            },
            onMediaClick: function (selecteditem) {
                self.previousItem = self.currentItem();
                self.beforeSelectionChange();
                var index = self.groups[selecteditem.groupIndex].itemsList.indexOf(selecteditem);
                self.itemUpdateTrigger = rin.ContentBrowserES.changeTrigger.onclick;
                self.afterSelectionChange(selecteditem.groupIndex, index);
            },
            onApplyKeyframe: function (selecteditem) {
                self.previousItem = self.currentItem();
                self.beforeSelectionChange();
                var index = self.groups[selecteditem.groupIndex].itemsList.indexOf(selecteditem);
                self.itemUpdateTrigger = rin.ContentBrowserES.changeTrigger.onkeyframeapplied;
                self.afterSelectionChange(selecteditem.groupIndex, index);
            },
            onExplore: function () {
                //When clicked on a preview image, launch a popup, or go to expanded mode
                self.getItemESData(self.currentItem());
                var popup = new rin.PopupControl(self.orchestrator);
                popup.load(self.currentItem().esData, self);
                self.currentMode = rin.ContentBrowserES.currentMode.expanded;

                $(popup).bind('onclose', function (e) {
                    self.currentMode = rin.ContentBrowserES.currentMode.preview;
                });
            },
            beforeSelectionChange: function () {
                self.isFirstItem(false);
                self.isLastItem(false);
                self.itemUpdateTrigger = rin.ContentBrowserES.changeTrigger.none;
            },
            afterSelectionChange: function (groupIndex, index) {
                if (index === 0 && groupIndex === 0)
                    self.isFirstItem(true);
                else if (index === (self.groups[groupIndex].itemsList.length - 1) && groupIndex === (self.groups.length - 1))
                    self.isLastItem(true);

                self.previousItem = self.currentItem();

                var selectedItem = self.groups[groupIndex].itemsList[index];
                if (self.currentMode == rin.ContentBrowserES.currentMode.expanded) {
                    self.getItemESData(selectedItem);
                }

                self.currentItem(selectedItem);
            },
            getItemESData: function (itemData) {
                if (itemData.esData === undefined) {
                    itemData.esData = rin.internal.esDataGenerator.getExperienceStream(itemData);
                }
            }
        };
        var self = collectionViewModel;
        collectionViewModel.initViewModel();
        return collectionViewModel;
    },
    _updateView: function () {
        //--once html, associated javascript and the collection data model are all loaded
        //--create and append the view, apply bindings and initialize the view javascript
        if (this._isHtmlLoaded && this._isJsLoaded && this._isJSONLoaded) {
            this._userInterfaceControl.appendChild(rin.util.createElementWithHtml(this._elementHtml).firstChild);
            ko.applyBindings(this.collectionViewModel, this._userInterfaceControl.firstChild);

            var viewLoad = this._dimension;
            if (viewLoad in rin.ContentBrowserES)
                new rin.ContentBrowserES[viewLoad](this._userInterfaceControl.firstChild);
        }
    },
    _loadCollectionJSON: function () {
        //--from the es data, load the collection json
        var resourceResolver = this._orchestrator.getResourceResolver();
        var resourceName = resourceResolver.resolveResource(this._esData.resourceReferences[0].resourceId, this._esData.experienceId);

        if (resourceName) {
            var self = this;
            var cache = !(self._orchestrator.getPlayerConfiguration().playerMode === rin.contracts.playerMode.AuthorerPreview || self._orchestrator.getPlayerConfiguration().playerMode === rin.contracts.playerMode.AuthorerEditor);
            rin.internal.JSONLoader.loadJSON(resourceName, function (data, jsonUrl) {
                self._collectionData = rin.internal.JSONLoader.processCollectionJSON(jsonUrl, data[0].collection, resourceResolver, true);
                self.setDataContext(self._collectionData);
                self.setState(rin.contracts.experienceStreamState.ready);
                self.displayKeyframe(self._lastKeyframe);
            }, function (error, jsonUrl) {
                self.setState(rin.contracts.experienceStreamState.error);
                self._orchestrator.eventLogger.logErrorEvent("Error: {0} downloading the json file: {1}", error, jsonUrl);
            }, cache);
        }
    }
};

rin.util.overrideProperties(rin.ContentBrowserES.prototypeOverrides, rin.ContentBrowserES.prototype);

rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.RinTemplates.MetroOneDTemplateES", function (orchestrator, esData) { return new rin.ContentBrowserES(orchestrator, esData, "OneD"); });
rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.RinTemplates.MetroTwoDTemplateES", function (orchestrator, esData) { return new rin.ContentBrowserES(orchestrator, esData, "OneD"); });
