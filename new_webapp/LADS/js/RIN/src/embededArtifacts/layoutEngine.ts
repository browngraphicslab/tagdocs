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
* This file  implements the  Layout Engine for Embedded Artifacts
* 
*/
/// <reference path="embeddedArtifactTypes.d.ts"/>
/// <reference path="diagnostics.d.ts"/>

module rin.embeddedArtifacts.BuiltinPolicies { }

module rin.embeddedArtifacts {

    var debug = rin.diagnostics.newDiagnosticsModule("EA-LE");

    //
    // Private WorkingArtifactsList class
    //


    class WorkingArtifactsListClass {
        forEach(func: (item: WorkingArtifact, id: string, list: WorkingArtifactList) => void ): void {
            processOwnProperties(this, func);
            /*var id;
            for (id in this) {
                if (this.hasOwnProperty(id)) {
                    var item = this[id];
                    func(item, id, this);
                }
            }*/
        }
    }

    //
    // Private class represents a single pipeline of embedded artifacts - from source through rendering engine.
    //
    class EmbeddedArtifactsPipeline {

        collection: DataCollection;
        workingItems: WorkingArtifactList;
        host: ArtifactHost;
        // FUTURE? itemPolicies: ItemEnvironmentalPolicy[]; // these are run through first
        groupPolicies: GroupEnvironmentalPolicy[]; // followed by these...
        provider: ProviderProxy;


        constructor(helper: LayoutEngineHelper, collection: DataCollection, groupPolicyIds: string[], /*itemPolicyIds: string[],*/ provider: ProviderProxy, host: ArtifactHost) {
            this.collection = collection;
            this.workingItems = new WorkingArtifactsListClass;
            this.host = host;
            this.provider = provider;
            // FUTURE? this.itemPolicies = [];
            this.groupPolicies = [];

            groupPolicyIds.forEach( (id)  =>  {  // LAMBDA FAT ARROW - note this is translated to _this!
                var policy = helper.newGroupPolicy(id, collection, provider);
                this.groupPolicies.push(policy);
            });

            /* FUTURE? 
            itemPolicyIds.forEach(function (id) {
                var policy = helper.newItemPolicy(id, collection, provider);
                this.itemPolicies.push(policy);
            });*/

        }

        process(keyframeState: SmallState) {

            //
            // Apply group policies...
            //
            this.groupPolicies.forEach( (policy) => { // FAT ARROW FUNCTION - this goes to _this
                policy.evaluate(this.workingItems, keyframeState);
            });

            /* FUTURE?
            
            //
            // Apply item policies...
            //
            if (this.itemPolicies.length !== 0) {
                this.workingItems.forEach(
                     (item, id, list) => {
                         var itemState: SmallState = this.extractItemStateFromExperienceState(keyframeState, this.collection.collectionId, id);
                         this.itemPolicies.forEach(
                             function (policy, index, a) {
                                 policy.evaluate(item, itemState);
                             }
                             )
                    }
                    );
            }
            */

            //
            // Pass to host
            //
            this.host.update(this.workingItems);
        }

        extractItemStateFromExperienceState(experienceState: SmallState, collectionId: string, itemId: string): SmallState {
            return {};
        };
    };


    export function newLayoutEngine(helper: LayoutEngineHelper): LayoutEngine {


        var pipelines =  {};


        return {

            addPipeline: function (collection: DataCollection, groupPolicyIds: string[], /*itemPolicyIds: string[],*/ provider: ProviderProxy, host: ArtifactHost): void {
                //
                // We do not support the same collection in multiple pipelines. Check if we already have one with this.
                //
                var collectionId = collection.collectionId;
                if (pipelines.hasOwnProperty(collectionId)) {
                    debug.throwDuplicateException("Already have pipeline with collection id " + collection.collectionId);
                };
                var newPipeline = new EmbeddedArtifactsPipeline(helper, collection, groupPolicyIds, /*itemPolicyIds,*/ provider, host);
                pipelines[collectionId] = (newPipeline);
            },

            deletePipeline: function (collectionId: string): void {
                //
                // We do not support the same collection in multiple pipelines. Check if we already have one with this.
                //
                if (pipelines.hasOwnProperty(collectionId)) {
                    delete pipelines[collectionId];

                }
            },

            render: function (experienceState: SmallState): void {

                processOwnProperties(pipelines, function (pipeline: EmbeddedArtifactsPipeline) {
                    pipeline.process(experienceState);
                });
            }
        };
    };

    export function newDefaultGroupPolicy(policyId: string, collection: DataCollection, provider: ProviderProxy): GroupEnvironmentalPolicy {
        var policyFactory = rin.embeddedArtifacts.BuiltinPolicies[policyId];
        return policyFactory && policyFactory.newInstance(collection, provider);
    }

    /* FUTURE?
    export function newDefaultItemPolicy(policyId: string, collection: DataCollection, provider: ProviderProxy): ItemEnvironmentalPolicy {
        var policyFactory = rin.ext.EmbeddedArtifacts.BuiltinPolicies[policyId];
        return policyFactory && policyFactory.newInstance(collection, provider);
    }
    */

    //
    // Utility function to run a function over all owned properties in an object.
    //
    function processOwnProperties(obj, func) {
        var id;
        for (id in obj) {
            if (obj.hasOwnProperty(id)) {
                var prop = obj[id];
                func(prop, id, obj);
            }
        }
    }

}