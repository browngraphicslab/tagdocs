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
* This file contains type definitions for Embedded Artifacts
* 
*/





// 
// 2D Point structure expected by optional 2D-specific methods. Units depend on context.
//
interface Point2D {

    x: number;
    y: number;
};


//
// Used to specify ranges, such as min/max zoom levels.
//
interface Interval {

    from: number;
    to: number;

};




interface Region {
    center: Point2D;
    span: Point2D;
}

//
// Structure of the display sliver (The state.display object of a working item).
// This is defined by one of the policies and is consumed
// by the EA Host.
//
interface DisplaySliver {

    //
    // Position of object in screen coordinates.
    //
    position?: Region;

    //
    // Relative level (z-order) compared to other objects in the comparison class (such as other EAs in the same pipeline).
    // Can take any value as it is purely for relative comparison.
    //
    level?: number;

    //
    // Opacity adjustment; If present modulate the visual opactity of the object. Between 0 and 1. 
    //
    opacity?: number;

    //
    // Scale factor for the visual.
    //
    scale?: number;

}

interface SoundSliver {
    
    //
    // *Fractional* level applied to overall volume of the object, if applicable.
    // A [0,1] range multiplicative factor applied to the "volume" level.
    // TODO: Condider defining units in dB.
    //
    level?: number;

    //
    // L-R Pan.
    // A [0-1] value, indicating fraction of sound energy diverted to the right speaker. 
    //
    pan?: number;

}


//
// Represents an instance of "small state" - logical state of a RIN Experience or Embedded Artifact.
// It is composed of a set of well-defined "sliver" properties associated with a "sliver target".
// Refer to the RIN declarative specification for sliver 
//
interface SmallState {

    display?: DisplaySliver;
    sound?: SoundSliver;

};




//
// Represents a data item - can have arbitrary data, however,
// we list some expected parameters for typical artifacts embedded in 2D worlds.
//
interface DataItem {

    // 
    // 2D world-specific parameters...
    //
    region?: Region; // Center and span ("width" and "height" in world coordinates of the artifact.
    // OBSOLETe center?: Point2D; // The world coordinates of the center or focal point of the artifact.
    // OBSOLETE span?: Point2D;   // The extent ("width" and "height") in world coordinates of the artifact.


    //
    // Normalized zoom range within which the artifact is visible by default (unless overridden by a policy and/or keyframe state)
    //
    zoomRange?: Interval;

    //
    // For Experiences that support an additional "linear parameter", the overall range of this parameter for which this parameter
    // is active (there could be finer grained structure detailing visibility as a function of this parameter that is specified separately.
    // This is a high-level range that may be used to shortlist artifacts for rendering.
    // Examples of experiences which support this linear parameter: video and multi-page documents.
    //
    parameterRange?: Interval;

    //
    // Zoom level at which the EA appears at its natural size.
    //
    maxScaleZoom?: number;
    

    // FUTURE:
    // Only one EA with a given equivalenceClass is displayed. Useful for cases when the ideal location of an artifact is dependent on what is in view
    // at the time (such as the label of a large feature such as a mountain). Multiple EAs
    // with the same equivalence class can be inserted and only one will be chosen.
    // Which one to display is determined by the policies.
    // equivalenceClass?: string; 

};


//
// Represents a data collection - an enumeration of data items, each with a unique id.
//
interface DataCollection {

    //
    // ID of the collection - typically the same ID referenced in 
    // Small State present in Experience Streams
    //
    collectionId: string;

    //
    // Enumeration function
    //
    forEach(func: (item: DataItem, id: string, collection?: DataCollection) => void ): void;

    // Presently not needed. Uncomment if needed. 
    // getItem (id: string) : DataItem;

};


//
// Structure of each item in WorkingArtifactList 
// 
interface WorkingArtifact {

    active: bool; // If false, policies and EA host should ignore it, but keep context around in case it become active again.
    sourceItem: DataItem; // Reference to the original (unmodified) item from the source collection.
    hostContext: any; // Host can set item-specific context here (like reference to a control)
    state: SmallState; // Small State for this artifact.
    // FUTURE
    // priority: number;
    // occludingWA: WorkingArtifact


    //obsolete. Instead set state.screen.x,y,height,width,opacity
    //x: number; // "Center-x" of artifact in normalized screen coordinates
    //y: number; // "Center-y" of artifact in normalized screen coordinates
    //width: number; // "Width" of artifact (where relevent, such as highlights)  as a fraction of window width. 0 otherwise.
    //height: number; // "Height" of artifact (where relevant, such as highlights) as a fraction of window height. 0 otherwise. 

    // obsolete. Set the appearance.opacity or animation.volume parameters.
    // strength: number; // A [0,1.0] measure of "strength or "emphasis". Host can leverage this to determine the opacity and/or volume or some other emphasis measure.

    // FUTURE / to be validated
    //  generation: number; // Incremented each time the item is processed. Used to age out stale items.

}




//
// Represents the current working list of artifact data items - that have been operated on by the policy.
// These are the list that is communicated to the "Host" i.e., RenderingEngine.
//
interface WorkingArtifactList {

    // it is a dictionary of WorkingArtifacts (can't specify that in TypeScript :-)
    // Item is looked up via list[itemId];

    //
    // Enumerator
    //
    forEach(func: (item: WorkingArtifact, id: string, list: WorkingArtifactList) => void ): void;

};


//
// Represents the "Host" - An entity that can render artifacts with behaviours.
//
interface ArtifactHost {

    //
    // Returns true if wa1 and wa2 overlap on screen.
    //
    checkOverlap(wa1: WorkingArtifact, wa2: WorkingArtifact): bool;

    //
    // Update/render the artifacts in the specified working list.
    //
    update(workingList: WorkingArtifactList): void;

};


//
// Interface to the provider, to get current world-speciic information, do world-to-viewport transformations, etc.
//
interface ProviderProxy {

    //
    // IMPLEMENTATION GUIDELINE: These methods are potentially called on every render cycle, so should be 
    // fast and avoid dynamic allocations.
    //

    //
    // Dimensions of the canvas within which the Experience is rendered,
    // in native coordinates. Center is the center of the screen and 
    // span contains the width and height.
    //
    getScreenDimensions(Region): void;

    //
    // Optional normalized zoom value encodes the logical "zoom level". It must run between
    // 0.0 : "fully zoomed OUT" -  the entire domain is mapped to a point on the screen.
    // 1.0 : "1:1" - The entire domain is visible and occupies maximal screen real estate.
    //  +infinity: "fully zoomed in" - a point in the world maps to the entire visible screen.
    //
    currentNormalizedZoom? (): number;

    //
    // Optional 2D-specific methods. The SCREEN points are specified with respect to the "window" 
    // within which the Experience is rendered and are in native coordinates.
    //
    // The world cordinates are dependent on the world coordinate system, which is different
    // for panoramas, Earth(geographic) and images. Refer to
    // experience-specific sliver documentation for specifics.
    //
    // Both return true if the resultant point is "valid". A point is not valid if it is self-occluded or logically would be "behind" the viewer. 
    // For example, if the world is a globe and from the present viewpoint, the specified point on the surface is occluded by the globe itself.
    // Another example, is a 360 degree panorama with the viewer at the center, and the point logically behind the viewer. In such cases,
    // the function must return false, and set the output x and y properties to NaN.
    //
    convertPointToScreen2D? (inPoint: Point2D, outPoint: Point2D): bool;
    convertPointToWorld2D? (inPoint: Point2D, outPoint: Point2D): bool;

    //
    // Certain 2D worlds have NONLINEAR mappings between world and screen coordinate systems, such as those emplying world coordinate systems 
    // that wrap around or have other extreme nonlinear behaviours. Providers for such worlds should implement the following methods that maps an entire
    // "rectangular" region from world to screen and vice versa. In some cases, the strict mappying may be two disconnected regions, in such a case,
    // only one region (with the right dimensions, with part of those off-screen) should be returned. If the mapped region is self-occluded or logically behind
    // the viewer, the function should return false, and set all numeric fields to NaN.
    //
    convertRegionToScreen2D? (inRegion: Region, outRegion: Region): bool;
    convertRegionToWorld2D? (inRegion: Region, outRegion: Region): bool;
    
    //
    // SPECIALIZED PROPERTIES
    // These are not widely used and presented here for documentation
    // conveniene.
    //

    //
    // Some experiences are parametrized along a "3rd" parameter. For video, this is the
    // video timeline. For documents, this is the page number. For a series of linked panoramas
    // it is the index of the panorama that is currently being viewed. The current value
    // of this linear parameter is returned by this method. The actual value depends on the
    // experience type:
    // -- For video it should be the real-valued time offset, in seconds and fractional seconds.
    // -- For documents, it is the 0-based page offset.
    // -- For image/panorama sequences, it is the 0-based image/pano offiset.
    //
    currentLinearParameter? (): number;



    // 
    // OBSOLETE - not using normalized screen coordinates...
    //
    // Optional 2D-specific methods. The SCREEN points are expected in "Normalized" screen
    // coordinates, where the visible portion of the viewport window is defined by the 4 points:
    //      Upper Left: (x=0.0, y=0.0)
    //      Upper Right: (x=1.0, y=0.0)
    //      Lower Left: (x=0.0, y=1.0)
    //      Lower Right: (x=1.0, y=1.0)
    //
    // The world cordinates are dependent on the world coordinate system, which is different
    // for panoramas, Earth(geographic) and images. Refer to
    // experience-specific sliver documentation for specifics.
    //
    // convertPointToScreenNormalized2D? (inPoint: Point2D, outPoint: Point2D): void;
    // convertPointToWorldNormalized2D? (inPoint: Point2D, outPoint: Point2D): void;

    //
    // OBSOLETE: Moved to OrchestratorProxy
    //
    // CHANGE: Returns if the provider is in the process of "playing" an Experience Stream. Should return false if the
    // experience is paused for interaction.
    // TODO: Introduce the concept of the LE state. SO it's not the responsibility of the
    // provider, plus we can introduce additional states. 
    //
    // isPlaying(): bool;

};


//
// Provides limited player/orchestrator context to the policy modules.
//
interface OrchestratorProxy {

    //
    // NOTE: These properites are in the exploration stage. Will be finalized
    // once first implementation is complete.
    //

    // True iff the experience is in the active playing state.
    isPlaying(): bool;

};


//
// An environmental policy that operates on the entire group, including the ability to
// completely re-organize the structure of the group, for example to collapse sets of artifacts into
// single composite artifacts.
//
interface GroupEnvironmentalPolicy {

    //
    // experienceState is the Small State for the whole experince.
    // 
    evaluate(workingList: WorkingArtifactList, experienceState: SmallState): void;

};


//
// FUTURE? POSSIBLY
//
// An environmental policy that operates on the level of an individual item.
// Note that each working item has a reference to the original source item, via
// the artifactState.sourceItem property (see WorkingArtifact). A policy can
// not delete or replace a working item. However, it can  mark it for deletion by setting active field to false.
// 
// IMPLEMENTATION NOTE: We will evaluate if we want to get rid of item-level policies.
//
// interface ItemEnvironmentalPolicy {
//
//  // eaState is the Small State for the specific artifact.
//  // evaluate(workingItem: WorkingArtifact, eaState: SmallState): void;
//
// };


//
// Users of the LayoutEngine must provide a set of methods used by the Layout Engine for various purposes.
//
interface LayoutEngineHelper {

    //
    // Construct a group policy instance - defined by the policyId, and associate with the instance the speciied
    // data collection and provider proxy.
    //
    newGroupPolicy(policyId: string, collection: DataCollection, provider: ProviderProxy): GroupEnvironmentalPolicy;

    //
    // POSSIBLE FUTURE
    // Construct an item policy instance - defined by the policyId, and associate with the instance the specified
    // data collection and provider proxy.
    //
    // newItemPolicy(policyId: string, collection: DataCollection, provider: ProviderProxy): ItemEnvironmentalPolicy;

    //
    // POSSIBLE FUTURE - if it turns out that the default internal implementation is too limiting...
    //
    // Extract and return any small state associated with the specific item Id within the collection with the specified collectionId (which is typically
    // but does not HAVE to be the collection ID referenced in small state). Return null if the item is not referenced.
    // IMPLEMENTATION NOTE: This function is called in the render cycle. Therefore, this should if possible not allocate a new object, instead return a reference to an existing object.
    // Caller SHOULD NOT modify the returned state!
    //
    // extractItemStateFromExperienceState: (experienceState: SmallState, collectionId:string, itemId:string) : SmallState;

};


//
// An instance of a Layout Engine. The Provider (or Discrete/Continuous base class!) maintains one instance of LayoutEngine per provider.
//
// Note on z-ordering of EAs and relationship to Pipelines:
// EAs from different pipelines cannot intermix, z-order wise. The relative levels of EAs in one pipeline vs. another is something that is specified outside the LayoutEngine related definitions. 
// It should be part of the manifest definition that Aldo creates, or can be hardcoded for now  – highlights have one level, others have higher levels, for example.
// The z-order of EAs *within* a pipeline are determined by the policies. The workingArtifact’s state.display.level property will be set to a numeric value by the policies.
// The Host should place EAs with higher levels above those with lower levels. If two EAs have the same level the host may display them in arbitrary relative z-level
//
interface LayoutEngine {

    //
    // Add a pipeline to the rendering loop. At present only pipeline per distinct collection (identified by its collection ID) is permitted.
    //
    addPipeline(collection: DataCollection, groupPolicyids: string[], /*itemPolicyIds: string[],*/ provider: ProviderProxy, host: ArtifactHost): void;

    //
    // Delete a pipeline, identified by the collection's collectionId.
    //
    deletePipeline(collectionId: string): void;

    //
    // Render all the artifacts managed by the layout engine.
    // experienceState represents the Small State of the experience, which is
    // typically governed by the currently active experience stream.
    //
    render(experienceState: SmallState);

};


//
// Global LayoutEngine factory module used to create instances of Layout Engines.
//
module rin.embeddedArtifacts {

    //
    // Create a new LayoutEngine instance (typically one per Experience Provider)
    //
    export function newLayoutEngine(helper: LayoutEngineHelper, orchestrator: OrchestratorProxy): LayoutEngine;

    //
    // Return a builtin (default) implementation of a group policy with the given name, if any. Return null otherwise.
    //
    export function newDefaultGroupPolicy(policyId: string, collection: DataCollection, provider: ProviderProxy, orchestrator: OrchestratorProxy): GroupEnvironmentalPolicy;

    //
    // FUTURE
    // Return a builtin (default) implementation of an item policy with the given name, if any. Return null otherwise.
    //
    // export function newDefaultItemPolicy(policyId: string, collection: DataCollection, provider: ProviderProxy, orchestrator: OrchestratorProxy): ItemEnvironmentalPolicy;

}
