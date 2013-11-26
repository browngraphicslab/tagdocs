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
* "ambientAudioPolicy" Embedded Artifacts Group Policy
* 
*/

/// <reference path="embeddedArtifactTypes.d.ts"/>


module rin.embeddedArtifacts.BuiltinPolicies.ambientAudioPolicy {

    interface WorkingArtifactEx extends WorkingArtifact {
        volume: number;
    };

    function emptySoundStateInstance(): SmallState {
        return {
            level: 0
        };
    }

    function OriginPoint(): Point2D {
        return {
            x: 0,
            y: 0
        };
    }

    function getRegion(r: Region): number {
        return r.span.x * r.span.y;
    }

    function getIntersectRegion(r1: Region, r2: Region): number {
        var Ax1 = r1.center.x - r1.span.x / 2,
            Ay1 = r1.center.y - r1.span.y / 2,
            Ax2 = r1.center.x + r1.span.x / 2,
            Ay2 = r1.center.y + r1.span.y / 2,
            Bx1 = r2.center.x - r2.span.x / 2,
            By1 = r2.center.y - r2.span.y / 2,
            Bx2 = r2.center.x + r2.span.x / 2,
            By2 = r2.center.y + r2.span.y / 2,
            x_overlap = Math.max(0, Math.min(Ax2, Bx2) - Math.max(Ax1, Bx1)),
            y_overlap = Math.max(0, Math.min(Ay2, By2) - Math.max(Ay1, By1));
        return (x_overlap * y_overlap);
    }

    function getDistance(p1: Point2D, p2: Point2D): number {
        var xDist = p1.x - p2.x,
            yDist = p1.y - p2.y;
        return Math.sqrt(xDist * xDist + yDist * yDist);
    }

    export function newInstance(collection: DataCollection, provider: ProviderProxy): GroupEnvironmentalPolicy {
        var screenDimensions: Region = { center: OriginPoint(), span: OriginPoint() };
        var tmpPoint1 = OriginPoint()// WARNING: Used by convertRegionToScreen
        var tmpPoint2 = OriginPoint()// WARNING: Used by convertRegionToScreen
        var convertRegionToScreen = provider.convertRegionToScreen2D || function (inRegion, outRegion) {
            var ret;
            ret = provider.convertPointToScreen2D(inRegion.center, outRegion.center);
            if (ret) {
                tmpPoint1.x = inRegion.center.x - inRegion.span.x / 2;
                tmpPoint1.y = inRegion.center.y - inRegion.span.y / 2;
                ret = provider.convertPointToScreen2D(tmpPoint1, tmpPoint2);
                if (ret) {
                    outRegion.span.x = Math.abs(outRegion.center.x - tmpPoint2.x) * 2.0;
                    outRegion.span.y = Math.abs(outRegion.center.y - tmpPoint2.y) * 2.0;
                }
            }
            if (!ret) {
                outRegion.center.x = outRegion.center.y = outRegion.span.x = outRegion.span.y = NaN;
            }
            return ret;
        };

        function evaluate(workingList: WorkingArtifactList, experienceSmallState: SmallState) {
            provider.getScreenDimensions(screenDimensions);
            var maxArea = getRegion(screenDimensions),
                maxDistance = getDistance(screenDimensions.center, OriginPoint());
            workingList.forEach(function (workingItem: WorkingArtifactEx, id) {
                if (!workingItem.state.sound) {
                    workingItem.state.sound = emptySoundStateInstance();
                }
                if (workingItem.active) {
                    var itemRegion = { center: OriginPoint(), span: OriginPoint() };
                    convertRegionToScreen(workingItem.sourceItem.region, itemRegion);
                    var itemIntersectArea = getIntersectRegion(screenDimensions, itemRegion),
                        volumeLevel = ((itemIntersectArea) / maxArea) * ((maxDistance - getDistance(itemRegion.center, screenDimensions.center))/maxDistance);
                    workingItem.state.sound.level = volumeLevel;
                }
                else {
                    workingItem.state.sound.level = 0;
                }
            });
        }
        return {
            evaluate: evaluate
        };
    };
}