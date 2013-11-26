LADS.Util.makeNamespace("Worktop.Doq");

/*
 * The Worktop.Doq class is used to convert the XML retreived from the server to a more usable
 * javascript object. The doq that is returned converts the XML into the following structure:
 * Object -> Identifier
 *        -> Name
 *        -> Metadata -> Type
 *                    -> Artist
 */

Worktop.Doq = function (xml) {

    // converts the text into xml
    var xmlNode = $.parseXML(xml);
    // converts the xml into a javascript object. however, due to the specific format of the xml returned, 
    // this object is impossible to use until furhter processing is done (particularly with the metadata)
    var doq = $.xml2json(xmlNode);

    // tells the local database to store the text xml in its cache, which is used to retrieve the XML when making changes in AuthoringMode
    if (doq.DoqData) {
        //There is more than one exhibition
        for (var i = 0; i < doq.DoqData.length; i++) {
            var obj = doq.DoqData[i];
            LADS.Worktop.Database.updateCache(obj.Identifier, xml);
        }
    } else {
        LADS.Worktop.Database.updateCache(doq.Identifier, xml);
    }


    /* 
     * This method basically takes the javascript object and removes all the uneccessary tags that the C#
     * XML serializer was responsible for creating
     */
    function fixMetadata(doq) {
        if (doq != undefined) {

            if (!doq.Metadata)
                return null;

            var metadata = {};
            var metadataElement = doq.Metadata.Dicts["KeyValueOfguidMetadataDictionaryYwP_PEBe9"] ? doq.Metadata.Dicts["KeyValueOfguidMetadataDictionaryYwP_PEBe9"].Value.Dict.KeyValueOfstringanyType : [];
            if (!metadataElement.length) {
                var key = metadataElement["Key"];
                var value = metadataElement["Value"];
                metadata[key] = value;
            } else {
                $.each(metadataElement, function (i) {
                    var key = metadataElement[i].Key;
                    var value = metadataElement[i].Value.text;
                    metadata[key] = value;
                });
            }
            doq.Metadata = metadata;
        }
    }
    
    /* 
     * The following code figures out whether the given XML contains and Array of DoqDatas or a singly DoqData.
     * If there is an array, then an array of javascript objects is created with the individual javascript objects
     */
    if (doq.DoqData) {
        var arrayOfDoqData = [];

        if (doq.DoqData[0]) {
            $.each(doq.DoqData, function (i) {
                fixMetadata(this);
                arrayOfDoqData.push(this);
            });
        }
        else {
            fixMetadata(doq.DoqData);
            arrayOfDoqData.push(doq.DoqData);
        }
        return arrayOfDoqData;
    } else if (doq.LinqData) {
        var arrayOfLinqData = [];

        if (doq.LinqData[0]) {
            $.each(doq.LinqData, function (i) {
                fixMetadata(this);
                arrayOfLinqData.push(this);
            });
        }
        else {
            fixMetadata(doq.LinqData);
            arrayOfLinqData.push(doq.LinqData);
        }
        return arrayOfLinqData;
    } else {
        fixMetadata(doq);
        return doq;
    }
}