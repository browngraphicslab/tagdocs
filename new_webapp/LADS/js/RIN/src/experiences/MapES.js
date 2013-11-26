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
/// <reference path="http://ecn.dev.virtualearth.net/mapcontrol/mapcontrol.ashx?v=7.0"/>

window.rin = window.rin || {};

(function (rin) {
    // ES for displaying bing maps.
    var MapES = function (orchestrator, esData) {
        MapES.parentConstructor.apply(this, arguments);
        var self = this;

        this._orchestrator = orchestrator;
        this._userInterfaceControl = rin.util.createElementWithHtml(MapES.elementHtml).firstChild;
        this._esData = esData;

        this._userInterfaceControl.addEventListener('mousedown', function () {
            self._orchestrator.startInteractionMode();
        }, true);
    };

    rin.util.extend(rin.contracts.DiscreteKeyframeESBase, MapES);

    MapES.prototypeOverrides = {
        _initMap: function (experienceStreamId) {
            // Create the map control.
            var mapOptions = {
                credentials: "AnEde1n9Se4JmFkyw76VxdSkFfSMm5bUaT1qp5ClQDw65KEtLsG0uyXWYtzWobgk",
                mapTypeId: Microsoft.Maps.MapTypeId.road,
                labelOverlay: Microsoft.Maps.LabelOverlay.hidden,
                enableClickableLogo: false,
                enableSearchLogo: false,
                showDashboard: false,
                showScalebar: false,
                showCopyright: false,
                backgroundColor: new Microsoft.Maps.Color(0, 0, 0, 0)
            };

            this._map = new Microsoft.Maps.Map(this._userInterfaceControl, mapOptions);

            // Use the base class to load the keyframes and seek to experienceStreamId.
            MapES.parentPrototype.load.call(this, experienceStreamId);

            // Set the state to Ready.
            this.setState(rin.contracts.experienceStreamState.ready);
        },
        load: function (experienceStreamId) {
            var self = this;
            if (window.MSApp && WinJS) {
                // Create the map control.
                Microsoft.Maps.loadModule('Microsoft.Maps.Map', {
                    callback: function () {
                        self._initMap(experienceStreamId);
                    },
                    culture: "en-us",
                    homeRegion: "US"
                });
            }
            else {
                this._initMap(experienceStreamId);
            }
        },
        unload: function () {
            MapES.parentPrototype.unload.call(this);
            if (typeof this._map != 'undefined' && this._map != null) {
                this._map.dispose();
                this._map = null;
            }
        },
        displayKeyframe: function (keyframeData) {
            if (keyframeData.state.viewport && keyframeData.state.viewport.region) {
                var viewOptions = { animate: true };
                var north = (keyframeData.state.viewport.region.center.y * 2 + keyframeData.state.viewport.region.span.y) / 2;
                var west = (keyframeData.state.viewport.region.center.x * 2 - keyframeData.state.viewport.region.span.x) / 2
                var south = (keyframeData.state.viewport.region.center.y * 2 - keyframeData.state.viewport.region.span.y) / 2;
                var east = (keyframeData.state.viewport.region.center.x * 2 + keyframeData.state.viewport.region.span.x) / 2;
                viewOptions.bounds = Microsoft.Maps.LocationRect.fromCorners(new Microsoft.Maps.Location(north, west), new Microsoft.Maps.Location(south, east));
            }            
            if (keyframeData.state.map && keyframeData.state.map.style) {
                var mapStyle = keyframeData.state.map.style;
                switch (mapStyle) {
                    case "Road":
                        viewOptions.mapTypeId = Microsoft.Maps.MapTypeId.road;
                        break;
                    case "Aerial":
                        // TODO: Switch labels off.
                        viewOptions.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                        break;
                    case "AerialWithLabels":
                        // TODO: Switch labels on.
                        viewOptions.mapTypeId = Microsoft.Maps.MapTypeId.aerial;
                        break;
                    case "Vector":
                        // TODO: Hide the default map tile layer.
                        viewOptions.mapTypeId = Microsoft.Maps.MapTypeId.road;
                        break;
                }
            }

            // [Aldo] There is some issue with the way we are organizing the div's i guess, in IE9, map keyframes are not rendered properly.
            //        Below changes in height and width is a hack to fix the issue. This makes the browser relayout the divs and it works fine.
            this._userInterfaceControl.style["height"] = "99.9999%";
            this._userInterfaceControl.style["width"] = "99.9999%";
            var self = this;
            setTimeout(function () {
                self._userInterfaceControl.style["height"] = "100%";
                self._userInterfaceControl.style["width"] = "100%";
                self._map.setView(viewOptions);
            }, 1);
        },

        // Pan the map by the given distance and direction.
        panBy: function (x, y) {
            var bounds = this._map.getBounds();
            var pixelCenter = this._map.tryLocationToPixel(bounds.center);
            pixelCenter.x += x;
            pixelCenter.y += y;

            var options = this._map.getOptions();
            options.center = this._map.tryPixelToLocation(pixelCenter);
            options.zoom = this._map.getZoom();
            this._map.setView(options);
        },

        // Zoom in to the Map.
        zoomInCommand: function () {
            var options = this._map.getOptions();
            options.zoom = this._map.getZoom() + 1;
            this._map.setView(options);
        },

        // Zoom out from the Map.
        zoomOutCommand: function () {
            var options = this._map.getOptions();
            options.zoom = this._map.getZoom() - 1;
            this._map.setView(options);
        },

        // Methods to pan the map.
        panLeftCommand: function () {
            this.panBy(-this._panDistance, 0);
        },
        panRightCommand: function () {
            this.panBy(this._panDistance, 0);
        },
        panUpCommand: function () {
            this.panBy(0, -this._panDistance);
        },
        panDownCommand: function () {
            this.panBy(0, this._panDistance);
        },
        // Get interaction controls for Map.
        getInteractionControls: function () {
            var self = this;
            if (!self._interactionControls) {
                self._interactionControls = document.createElement("div");

                self._orchestrator.getInteractionControls([rin.contracts.interactionControlNames.panZoomControl],
                    function (wrappedInteractionControls) {
                        rin.util.assignAsInnerHTMLUnsafe(self._interactionControls, wrappedInteractionControls.innerHTML);
                        ko.applyBindings(self, self._interactionControls);
                    });
            }

            return self._interactionControls;
        },
        captureKeyframe: function () {
            // Set the state to Ready.
            if (this._map === null) return;
            var bounds = this._map.getBounds(),
                north = bounds.getNorth(),
                south = bounds.getSouth(),
                east = bounds.getEast(),
                west = bounds.getWest(),
                mapTypeId = this._map.getMapTypeId(), mapType;
            switch (mapTypeId) {
                case Microsoft.Maps.MapTypeId.road:
                    mapType = "Road";
                    break;
                case Microsoft.Maps.MapTypeId.aerial:
                    // TODO: Switch labels off.
                    mapType = "Aerial";
                    break;
                case Microsoft.Maps.MapTypeId.aerial:
                    // TODO: Switch labels on.
                    mapType = "AerialWithLabels";
                    break;
                case Microsoft.Maps.MapTypeId.auto:
                    mapType = "Auto";
                    break;
                case Microsoft.Maps.MapTypeId.birdseye:
                    mapType = "BirdsEye";
                    break;
                case Microsoft.Maps.MapTypeId.collinsBart:
                    mapType = "CollinsBart";
                    break;
                case Microsoft.Maps.MapTypeId.mercator:
                    mapType = "Mercator";
                    break;
                case Microsoft.Maps.MapTypeId.ordnanceSurvey:
                    mapType = "OrdnanceSurvey";
                    break;
            }
            
            return {
                "state": {
                    "viewport": {
                        "region": {
                            "center": {
                                "x": (east + west)/2,
                                "y": (north + south)/2
                            },
                            "span": {
                                "x": (east - west),
                                "y": (north - south)
                            }
                        }
                    },
                    "map": {
                        "style" : mapType
                    }
                }
            };
        },

        isExplorable: true,
        _panDistance: 100, // default pan distance
        _interactionControls: null,
        _map: null
    };

    MapES.elementHtml = "<div style='height:100%;width:100%;position:absolute;background:black;'></div>";
    rin.util.overrideProperties(MapES.prototypeOverrides, MapES.prototype);
    rin.ext.registerFactory(rin.contracts.systemFactoryTypes.esFactory, "MicrosoftResearch.Rin.MapExperienceStream", function (orchestrator, esData) { return new MapES(orchestrator, esData); });
})(rin);