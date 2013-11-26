/// <reference path="../core/Common.js" />

window.rin = window.rin || {};
window.rin.internal = window.rin.internal || {};

//--Loads a JSON collection
rin.internal.JSONLoader = {
    loadJSON: function (jsonUrl, onsuccess, onerror, loadCachedCopy) {
        var cachedCopy = true;

        if (typeof loadCachedCopy !== undefined)
            cachedCopy = loadCachedCopy;
        
        var options = {
            url: jsonUrl,
            dataType: "json",
            cache: cachedCopy,
            error: function (jqxhr, textStatus, errorThrown) {
                onerror(errorThrown, jsonUrl);
            },
            success: function (data, textStatus, jqxhr) {
                onsuccess(data, jsonUrl);
            }
        };
        $.ajax(options);
    },
    //--Processes a JSON Collection, by creating lists for binding from the group/item dictionaries
    processCollectionJSON: function (jsonUrl, collectionData, resourceResolver, resolveIncludes) {
        //--properties to look out for to call resolveResourceReference on
        var properties = new rin.internal.List("thumbnailMedia", "src", "largeMedia", "smallMedia");
        collectionData.groupsList = rin.util.getDictionaryValues(collectionData.layout.groups);

        var lastSlashPos = jsonUrl.lastIndexOf("/");
        var rootUrl = jsonUrl.substr(0, lastSlashPos);

        var groupIndex = 0;
        collectionData.groupsList.foreach(function (group) {
            group.itemsList = rin.util.getDictionaryValues(group.items);
            group.itemsList.foreach(function (item) {
                if (resolveIncludes) {
                    if (item.includes) {
                        var itemToInclude = rin.util.deepCopy(collectionData.items[item.includes]);
                        rin.util.overrideProperties(item, itemToInclude); //This keeps the overriden properties in item as such
                        rin.util.overrideProperties(itemToInclude, item); //This copies missing data back to item
                    }
                }
                properties.foreach(function (property) {
                    //--resolve resource reference
                    if (item.hasOwnProperty(property) && item[property].lastIndexOf("http", 0) !== 0) {
                        item[property] = rin.util.combinePathElements(rootUrl, item[property]);
                    }
                });
                item.groupIndex = groupIndex;
            });
            groupIndex++;
        });

        for (var itemId in collectionData.items) {
            var item = collectionData.items[itemId];
            properties.foreach(function (property) {
                //--resolve resource reference
                if (item.hasOwnProperty(property) && item[property].lastIndexOf("http", 0) !== 0) {
                    item[property] = rin.util.combinePathElements(rootUrl, item[property]);
                }
            });
        }

        return collectionData;
    }
};