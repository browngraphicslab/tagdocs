var objectCollection = {
    loop : function(obj, propertyName, keyCollectionFunction) {
        var k;
        for(k in obj[propertyName]) {
            if(obj[propertyName].hasOwnProperty(k)) {
                keyCollectionFunction(k, obj[propertyName][k]);
            }
        }
    },

    loopByType : function(obj, keyCollectionFunction) {
        objectCollection.loop(obj, 'byType', keyCollectionFunction);
    }
};

/**
 * This holds RML which is being renderer. It does not do any IO.
 * The update frame loop will compute a series of additions
 * and removals of entities and applies them to this datastructure.
 */
 var RMLStore = function () {
     var self = this;

     /**
      *  Holds arrays of entities indexed by id
      */
     self.byId = {};

     /**
      * Holds arrays of entities indexed by the entity type
      */
     self.byType = {};

     /**
      * Adds an entity to the scene.
      * It also updates book keeping structures (byId,byType,byName)
      */
     self.add = function (itemToAdd) {
         if(itemToAdd.id == null) {
             throw 'expected id property on the item';
         }
         if(!itemToAdd.type) {
             throw 'expected type property on the item';
         }

         self.byId[itemToAdd.id] = itemToAdd;
         self.byType[itemToAdd.type] = self.byType[itemToAdd.type] || [];
         self.byType[itemToAdd.type].push(itemToAdd);
     };

     /**
      * This removes entity from the scene.
      */
     self.remove  = function (itemToRemoveId) {
         var obj;
        if(typeof(item) === 'number') {
            obj = self.byId[itemToRemoveId];
            self.byType[obj.type].remove(obj);
            if(self.byType[obj.type].length === 0) {
                delete self.byType[obj.type];
            }
            delete self.byId[itemToRemoveId];
        } else {
            throw 'Expected a single ID';
        }
     };

     /**
      * Given an object of the form
      * {
      *   added: [{..},{..}]
      *   removed: [] //entityIds
      * }
      * This updates the scene accordingly.
      */
     self.update =  function(delta) {
         var i;
         if(delta.added) {
             for(i = 0; i < delta.added.length; ++i) {
                 self.add(delta.added[i]);
             }
         }

         if(delta.removed) {
             for(i = 0; i < delta.removed.length; ++i) {
                 self.remove(delta.removed[i]);
             }
         }
     };
 };
