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
var rin;
(function (rin) {
    (function (embeddedArtifacts) {
            })(rin.embeddedArtifacts || (rin.embeddedArtifacts = {}));
    var embeddedArtifacts = rin.embeddedArtifacts;
})(rin || (rin = {}));
var rin;
(function (rin) {
    (function (embeddedArtifacts) {
        var debug = rin.diagnostics.newDiagnosticsModule("EA-LE");
        //
        // Private WorkingArtifactsList class
        //
        var WorkingArtifactsListClass = (function () {
            function WorkingArtifactsListClass() { }
            WorkingArtifactsListClass.prototype.forEach = function (func) {
                processOwnProperties(this, func);
                /*var id;
                for (id in this) {
                if (this.hasOwnProperty(id)) {
                var item = this[id];
                func(item, id, this);
                }
                }*/
                            };
            return WorkingArtifactsListClass;
        })();        
        //
        // Private class represents a single pipeline of embedded artifacts - from source through rendering engine.
        //
        var EmbeddedArtifactsPipeline = (function () {
            function EmbeddedArtifactsPipeline(helper, collection, groupPolicyIds, /*itemPolicyIds: string[],*/ provider, host) {
                var _this = this;
                this.collection = collection;
                this.workingItems = new WorkingArtifactsListClass();
                this.host = host;
                this.provider = provider;
                // FUTURE? this.itemPolicies = [];
                this.groupPolicies = [];
                groupPolicyIds.forEach(function (id) {
                    // LAMBDA FAT ARROW - note this is translated to _this!
                    var policy = helper.newGroupPolicy(id, collection, provider);
                    _this.groupPolicies.push(policy);
                });
                /* FUTURE?
                itemPolicyIds.forEach(function (id) {
                var policy = helper.newItemPolicy(id, collection, provider);
                this.itemPolicies.push(policy);
                });*/
                            }
            EmbeddedArtifactsPipeline.prototype.process = function (keyframeState) {
                var _this = this;
                //
                // Apply group policies...
                //
                this.groupPolicies.forEach(function (policy) {
                    // FAT ARROW FUNCTION - this goes to _this
                    policy.evaluate(_this.workingItems, keyframeState);
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
            };
            EmbeddedArtifactsPipeline.prototype.extractItemStateFromExperienceState = function (experienceState, collectionId, itemId) {
                return {
                };
            };
            return EmbeddedArtifactsPipeline;
        })();        
        ; ;
        function newLayoutEngine(helper) {
            var pipelines = {
            };
            return {
                addPipeline: function (collection, groupPolicyIds, /*itemPolicyIds: string[],*/ provider, host) {
                    //
                    // We do not support the same collection in multiple pipelines. Check if we already have one with this.
                    //
                    var collectionId = collection.collectionId;
                    if(pipelines.hasOwnProperty(collectionId)) {
                        debug.throwDuplicateException("Already have pipeline with collection id " + collection.collectionId);
                    }
                    ; ;
                    var newPipeline = new EmbeddedArtifactsPipeline(helper, collection, groupPolicyIds, /*itemPolicyIds,*/ provider, host);
                    pipelines[collectionId] = (newPipeline);
                },
                deletePipeline: function (collectionId) {
                    //
                    // We do not support the same collection in multiple pipelines. Check if we already have one with this.
                    //
                    if(pipelines.hasOwnProperty(collectionId)) {
                        delete pipelines[collectionId];
                    }
                },
                render: function (experienceState) {
                    processOwnProperties(pipelines, function (pipeline) {
                        pipeline.process(experienceState);
                    });
                }
            };
        }
        embeddedArtifacts.newLayoutEngine = newLayoutEngine;
        ; ;
        function newDefaultGroupPolicy(policyId, collection, provider) {
            var policyFactory = rin.embeddedArtifacts.BuiltinPolicies[policyId];
            return policyFactory && policyFactory.newInstance(collection, provider);
        }
        embeddedArtifacts.newDefaultGroupPolicy = newDefaultGroupPolicy;
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
            for(id in obj) {
                if(obj.hasOwnProperty(id)) {
                    var prop = obj[id];
                    func(prop, id, obj);
                }
            }
        }
    })(rin.embeddedArtifacts || (rin.embeddedArtifacts = {}));
    var embeddedArtifacts = rin.embeddedArtifacts;
})(rin || (rin = {}));
//@ sourceMappingURL=layoutEngine.js.map
