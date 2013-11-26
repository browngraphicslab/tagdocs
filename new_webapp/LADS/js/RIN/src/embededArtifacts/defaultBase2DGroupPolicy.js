/*!
*
* RIN Core JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright (c)  2013, Microsoft Research
* By using this source you agree to the terms and conditions detailed in the following licence:
*     http://rinjs.org/licenses/v1.0/
*
* Date: 2013-MARCH-01
*
* This file implements the default (built in) implementation of the
* "base2DGroupPolicy" Embedded Artifacts Group Policy
*
*/
/// <reference path="embeddedArtifactTypes.d.ts"/>
var rin;
(function (rin) {
    (function (embeddedArtifacts) {
        (function (BuiltinPolicies) {
            (function (base2DGroupPolicy) {
                ; ;
                function newInstance(collection, provider) {
                    var MAX_INACTIVE_COUNT = 1;
                    var tmpRegion = {
                        center: {
                            x: 0,
                            y: 0
                        },
                        span: {
                            x: 0,
                            y: 0
                        }
                    };// WARNING: used in return function "evaluate".
                    
                    var tmpPoint1 = {
                        x: 0,
                        y: 0
                    };// WARNING: Used by convertRegionToScreen
                    
                    var tmpPoint2 = {
                        x: 0,
                        y: 0
                    };// WARNING: Used by convertRegionToScreen
                    
                    var screenDimensions = {
                        center: {
                            x: 0,
                            y: 0
                        },
                        span: {
                            x: 0,
                            y: 0
                        }
                    };
                    var workingItemsToCull = [];
                    var minEAScale = 0.24, maxEAScale = 1;
                    var convertRegionToWorld = provider.convertRegionToWorld2D || function (inRegion, outRegion) {
                        return false;
                    };
                    var convertRegionToScreen = provider.convertRegionToScreen2D || function (inRegion, outRegion) {
                        //
                        // This function calls convertRegionToPoint2D to transform the center, then computes the height and width by
                        // transforming another point (height/2, width/2) away and computing the difference. It will work fine for the case that
                        // there is no coordinate rollover and the world-to-viewport transformation is linear.
                        //
                        // NOTE: It uses TMP VARIABLES tmpPoint1, tmpPoint2!
                        //
                        var ret;
                        ret = provider.convertPointToScreen2D(inRegion.center, outRegion.center);
                        if(ret) {
                            tmpPoint1.x = inRegion.center.x - inRegion.span.x / 2;
                            tmpPoint1.y = inRegion.center.y - inRegion.span.y / 2;
                            ret = provider.convertPointToScreen2D(tmpPoint1, tmpPoint2);
                            if(ret) {
                                outRegion.span.x = Math.abs(outRegion.center.x - tmpPoint2.x) * 2.0;
                                outRegion.span.y = Math.abs(outRegion.center.y - tmpPoint2.y) * 2.0;
                            }
                        }
                        if(!ret) {
                            outRegion.center.x = outRegion.center.y = outRegion.span.x = outRegion.span.y = NaN;
                        }
                        return ret;
                    };
                    //function interval_intersects(i1from: number, i1to: number, i2from: number, i2to: number): bool {
                    //    return (i1from <= i2from) ? (i1to > i2from) : interval_intersects(i2from, i2to, i1from, i1to);
                    //};
                    function region_intersects(r1, r2) {
                        // Assumes no coordinate roll-over.
                        // Get vertices of the two regions.
                                                var Ax1 = r1.center.x - r1.span.x / 2, Ay1 = r1.center.y - r1.span.y / 2, Ax2 = r1.center.x + r1.span.x / 2, Ay2 = r1.center.y + r1.span.y / 2, Bx1 = r2.center.x - r2.span.x / 2, By1 = r2.center.y - r2.span.y / 2, Bx2 = r2.center.x + r2.span.x / 2, By2 = r2.center.y + r2.span.y / 2;
                        // Check if regions overlap.
                        return (Ax1 <= Bx2 && Ax2 >= Bx1 && Ay1 <= By2 && Ay2 >= By1);
                        //return interval_intersects(r1.center.x - r1.span.x / 2, r1.center.x + r1.span.x / 2, r2.center.x - r2.span.x / 2, r2.center.x + r2.span.x / 2)
                        //&& interval_intersects(r1.center.y - r1.span.y / 2, r1.center.y + r1.span.y / 2, r2.center.y - r2.span.y / 2, r2.center.y + r2.span.y / 2);
                                            }
                    ; ;
                    function copyPoint(from, to) {
                        to.x = from.x;
                        to.y = from.y;
                    }
                    function copyRegion(from, to) {
                        copyPoint(from.center, to.center);
                        copyPoint(from.span, to.span);
                    }
                    function emptyStateInstance() {
                        return {
                            display: {
                                position: {
                                    center: {
                                        x: NaN,
                                        y: NaN
                                    },
                                    span: {
                                        x: NaN,
                                        y: NaN
                                    }
                                },
                                level: 0,
                                scale: null
                            }
                        };
                    }
                    return {
                        evaluate: function (workingList, experienceSmallState) {
                            var currentLinearParameter = provider.currentLinearParameter ? provider.currentLinearParameter() : NaN;
                            var currentZoom = provider.currentNormalizedZoom ? provider.currentNormalizedZoom() : NaN;
                            provider.getScreenDimensions(screenDimensions);
                            //
                            // Run through each item in the working list, marking them inactive...
                            //
                            workingList.forEach(function (workingItem, id) {
                                if(workingItem.active) {
                                    workingItem.inactiveCount = 0;
                                } else {
                                    var prevCount = workingItem.inactiveCount || 0;
                                    workingItem.inactiveCount = prevCount + 1;
                                    if(workingItem.inactiveCount > MAX_INACTIVE_COUNT) {
                                        workingItemsToCull.push(id);
                                    }
                                }
                                workingItem.active = false;
                            });
                            //
                            // Delete working items that have been hanging around for too many render cycles...
                            //
                            if(workingItemsToCull.length > 0) {
                                workingItemsToCull.forEach(function (id) {
                                    delete workingList[id]// TODO - notify host if non-null host context??
                                    ;
                                });
                                workingItemsToCull = [];
                            }
                            //
                            // Process each item in the collection. If it's in scope, create the object if necessary and update it. If it's not
                            // in scope and still exists, mark it inactive.
                            //
                            collection.forEach(function (item, id) {
                                var workingItem = workingList[id];
                                var active = true;
                                var range, scaleFactor = null, maxScaleZoom = item.maxScaleZoom || NaN;
                                // Scale EA visual depending on zoomlevel
                                                                // Check linear parameter is in range if there is one...
                                if(!isNaN(currentLinearParameter)) {
                                    range = item.parameterRange;
                                    if(range) {
                                        active = currentLinearParameter >= range.from && currentLinearParameter <= range.to;
                                    }
                                }
                                // Check zoom level is in range if there is one...
                                if(active && !isNaN(currentZoom)) {
                                    range = item.zoomRange;
                                    if(range) {
                                        active = currentZoom >= range.from && currentZoom <= range.to;
                                    }
                                }
                                // Check if the item is within the field of view...
                                active = active && convertRegionToScreen(item.region, tmpRegion);
                                active = active && region_intersects(screenDimensions, tmpRegion);
                                if(active) {
                                    // Item is in scope spatially... check if it is in the working set.
                                    if(workingItem) {
                                        workingItem.active = true;
                                        if(workingItem.sourceItem != item) {
                                            // Hmm, the previous mapping between working item and source item is broken.
                                            // This can happen if the source Item list has been re-built, which can happen in
                                            // editing scenarios.
                                            // Let's treat it as a new item....
                                            workingItem.sourceItem = item;
                                            workingItem.hostContext = null// TODO: inform host about this?
                                            ;
                                            workingItem.state = emptyStateInstance();
                                        }
                                    } else {
                                        // Item is in scope  but we don't have it in the working list. Create it...
                                        // TODO: move to constructor once things are settled...
                                        workingItem = {
                                            active: true,
                                            sourceItem: item,
                                            hostContext: null,
                                            state: emptyStateInstance()
                                        };
                                        //function castToWA(sourceItem): WorkingArtifact { return sourceItem };
                                        //function castToAny(sourceItem): any { return sourceItem };
                                        //workingItem = castToWA(item);
                                        workingList[id] = workingItem;
                                    }
                                    //
                                    // Copy over screen coordinates
                                    //
                                    copyRegion(tmpRegion, workingItem.state.display.position);
                                    // Calculate scale of visual relative to the zoom level of the ES
                                    if(!isNaN(currentZoom) && !isNaN(maxScaleZoom)) {
                                        scaleFactor = Math.max(minEAScale, Math.min(1, currentZoom / maxScaleZoom));
                                        workingItem.state.display.scale = scaleFactor;
                                    }
                                    //
                                    // Check if item is overridden to be visible based on the small state.
                                    //
                                    // TODO; for now we ignore small state info.
                                    //var forceVisible = false;
                                                                    }
                                if(!active) {
                                    // item is not in scope...
                                    if(workingItem) {
                                        workingItem.active = false;
                                    }
                                }
                            });
                        }
                    };
                }
                base2DGroupPolicy.newInstance = newInstance;
                ; ;
            })(BuiltinPolicies.base2DGroupPolicy || (BuiltinPolicies.base2DGroupPolicy = {}));
            var base2DGroupPolicy = BuiltinPolicies.base2DGroupPolicy;
        })(embeddedArtifacts.BuiltinPolicies || (embeddedArtifacts.BuiltinPolicies = {}));
        var BuiltinPolicies = embeddedArtifacts.BuiltinPolicies;
    })(rin.embeddedArtifacts || (rin.embeddedArtifacts = {}));
    var embeddedArtifacts = rin.embeddedArtifacts;
})(rin || (rin = {}));
//@ sourceMappingURL=defaultBase2DGroupPolicy.js.map
