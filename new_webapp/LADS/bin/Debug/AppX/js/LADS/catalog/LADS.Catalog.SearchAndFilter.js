LADS.Util.makeNamespace("LADS.Catalog.SearchAndFilter");


/********************************************************************************
HEADER COMMENTS (Aug. 3rd 2012) by David Correa:

DESCRIPTION: This is the constructor of the search and filter objects.
It takes the container element "elt" and an array with all the artworks. 
As you can see the array is not specified in the parameters of the function
because the server was not completely ready and real data was passed to the widget.
Therefore dummy data was used. 

FAQs

How to use this widget with proper data?
-Once the server is able to get all the artworks in an array with the ENTIRE collection,
one only needs to add the missing parameter to the function AND then assign it to the 
declared variable named "collection." And of course one need to instantiate the object
but it currently (at the time in which this was written) being instantiated.

How is the searching and filtering being done?
-   The first method being called is processObjects(inputArray) which takes in the 
variable named collection. In this method the makeObjectProperties(elmt) is called 
for every element in the collection's array. The makeObjectProperties(elmt) creates 
a new "searchable Object" and by looking at the properties of the element that
was passed by as a parameter it determines which properties are considered searchable.
Those that meet the criteria are assiged to the new searchable object. 
makeObjectProperties(elmt) is the method where one can specify which fields 
should not be used as filtering criteria.

    After the makeObjectProperties(elmt) method is called for every 
element in the array that was given to the processObject(inputArray), 
then the createWorksCounter() method is called. This method creates 
an object that links every possible search string 
(which are basically object properties) to a number equal to the number of 
artworks that contain or that are linked to that search field.

    After this is done, the method createAdditionalObjects() is called and the returning
array is given to the additionalObjects variable. This method creates additional 
objects to be displayed in the autocomplete results div. These objects are based on the 
information conatined in each artwork THAT IS INSIDE the filteredObjectsArray variable.
Please NOTE that here we also need to factor out the fields inside the objects that one
does not want to have objects created from and displayed in the autocomplete reuslts div.

    Finally, the last method call inside processObjects(inputArray) is the one in which 
the objectsArray and the additionalObjects array are concatenated into the sourceArray variable,
that as you might have guessed is the source of the autocomplete widget.

    The process described above is everything that happens at the moment of instantiation.
When the user selects an option from the results div, a small box is created in the 
div that contains the filter results. The value of the selection is automatically added 
to the array named filterResults, at the same time a button with the value in it appears
in the filter div. Immediately after, the updateSource() method is called, this another very
important method for this widget.

    The updateSource() method  gets the number of fields present/represented in the div that 
contains the filter results (and hence in the filterResults array). It then checks inside 
every artwork top see if they meet the filtering criteria (more on this later), if they do 
they are added to the filteredObjectsArray array. Then the additional objects are fetched
with the getAdditionalObjects() method and the two arrays are concatenated to create the new
sourceArray array. The final process of this method is removing the objects in the sourceArray
that have the same value as the items contained in the filter results div.

How does the filtering criteria work?
-    Simply put, between fields we use the && logical operator and INSIDE fields we have the || operator.

NOTE: The process that begins this is at the very end of this file.

TODO:
-To solve the issue of the tags I will create a variable that will know about the current labels 
this will synchronize what is displayed with what the functionality.
-We have to update the array with objects when there is an element eliminated from the filterBox. 
**********************************************************************************/
LADS.Catalog.SearchAndFilter = function (elt, artworks, timeline, search, filterBox) {
    "use strict";
    var that = this;
    //Here we have now a collection to the timeline and we can manipulate it however we want.
    timeline = timeline;
    timeline.draw();
    var timelineObjects = []; //these objects will be returned to the timeline

    var collection = artworks;
    var filterDiv = elt.children()[0]; //Widget container
    var searchInput = elt.children()[1]; // Widget container
    var filterResults = []; //Array that will contain the fields to filter
    var objectsArray = []; //Objects
    //At the beginning. the filtered objects and the objects are the same 
    var filteredObjectsArray = [];// This array will contain the objects of the additional properties.
    var additionalObjects = [];
    var sourceArray = [];//Source used by the widget

    var miniWorksCounter = {}; //keeps the number of artworks under a certain keyword
    var additionalObjectsDatabase;//Stores all the additional objects to be displayed.
    var dataOfLblsInFltr = {}; // This variable will know about all the labels in the filter box.

    var maxProperties = 0;

    var titlesArray = [];

    var allObjectKeywords = [];
    var allKeywords = [];
    // This will store the actual objects that are used to create the labels in the arangeInSections();
    // I will pass this array around, back and ford to be able to keep the previous arrangement of the catalog front page.
    var filterObjects = [];//variable that contains the elements that reflect the "current state" of the timeline
    var setUpFilterObjects = [];//local var used only in this.setUp

    /**************************************************
    This function will return the objects that will help
    set up the start page.
    ***************************************************/
    this.getFilterObjects = function () {
        return filterObjects;
    };
    /**************************************************
    This function will set the objects that will help
    set up the start page.
    ***************************************************/
    this.setFilterObjects = function (settingObjs) {
        if (settingObjs) {
            setUpFilterObjects = settingObjs;
            that.setUp();
        }
    };
    /*******************
    This function will be called when everything is ready in the catalog mode to make the keywords appear.
    *******************/
    this.setUp = function () {
        function clickHelper() {
            var wordRemoved = $(this).parent().button("option", "label");

            indexItem = filterResults.indexOf(wordRemoved);
            //$('#' + indexItem.toString()).remove();//Removes the line break added.
            filterResults.splice(indexItem, 1);
            updateSource();
            search.autocomplete("option", "source", allKeywords);

            //this following loop checks to see if the labels have something under them
            //if they do not then the whole span is deleted.
            $(this).parent().remove();
            var child = filterBox[0].firstChild;
            while (child) { //child is span
                var txt = child.firstChild; //Text
                var lst = txt.nextSibling;//List
                var nextChild = child.nextSibling;//Second span
                var firstElementList = lst.firstChild;//First Element in list
                var childFirstListEl = firstElementList.firstChild;
                if (firstElementList === null) {
                    $(child).remove();
                }
                child = nextChild;
            }
        }

        if (setUpFilterObjects !== null && setUpFilterObjects.length !== 0) {
            var len = setUpFilterObjects.length;
            var j = 0;

            for (j ; j < len; j++) {
                var obj = setUpFilterObjects[j];
                arrangeInSections(obj);
                updateSource();
                //Button css
                $(".filters").css({
                    'background-image': 'none',
                    'background-color': 'rgb(79,83,79)',
                    'border-width': '1%',
                    'border-color': 'rgb(243,242,241)',
                    'color': 'white',
                    'font-weight': 'normal',
                    'overflow': 'hidden',
                });
                $("span.ui-button-icon-secondary.ui-icon.ui-icon-circle-close").on("click", clickHelper);
            }
            setUpFilterObjects = [];
        }
    };

    /***************************************************
    This method will create an array that will have all the properties
    of a collection arranged by field in separate slots.
    This method should be called only after all the objects in the collection
    have been passed through the makeObjectProperties() method.
    ***************************************************/
    var processObjects = function (inputArray) {
        for (var i = 0; i < inputArray.length; i++) {
            makeObjectProperties(inputArray[i].Metadata, i);
        }
        createWorksCounter();
        additionalObjects = createAdditionalObjects();
        sourceArray = sourceArray.concat(objectsArray, additionalObjects);
        allKeywords = additionalObjects;
    };
    /*********************
    This function adds an obj to the collection. 
    **********************/
    var addObject = function (obj) {
        objectsArray.push(obj);
        filteredObjectsArray.push(obj);
    };
    /******************* 
    This following method is in charge of creating the objects that the filtering 
    widget will use. It makes sure that the objects we are working with have a reference
    to their own url and that they keep the properties that are only going to be
    iterated through.

    The new addition creates a new array if the field is a single string.
    elmt is the Metadata from which we will create our new objects
    *******************/
    var makeObjectProperties = function (elmt, univCounter) {
        var searchableObj = {};
        var tempArray = [];
        var propCounter = 0;
        var nameDone = false;
        for (var prop in elmt) {

            if (prop === "Thumbnail") {
                searchableObj.Thumbnail = elmt[prop];
                continue;
            }
            if (prop === "Location") {
                searchableObj.Location = elmt[prop];
                continue;
            }
            if (prop === "Exhibition") {
                searchableObj.Exhibition = elmt[prop];
                continue;
            }
            if (prop === "Medium") {
                searchableObj.Medium = elmt[prop];
                continue;
            }
            if (prop === "__LastAccessed") {
                searchableObj.__LastAccessed = elmt[prop];
                continue;
            }
            if (prop === "Type") {
                searchableObj.Type = elmt[prop];
                continue;
            }
            if (prop === "__Created") {
                searchableObj.__Created = elmt[prop];
                continue;
            }
            if (prop === "DeepZoom") {
                searchableObj.DeepZoom = elmt[prop];
                continue;
            }
            if (prop === "Description") {
                searchableObj.Description = elmt[prop];
                continue;
            }

            if (prop === "Title") {//special changes for title
                /*
                searchableObj['value'] = elmt[prop];
                searchableObj['label'] = elmt[prop];
                titlesArray.push(elmt[prop]);
                tempArray = [];
                tempArray.push(elmt[prop]);
                searchableObj[prop] = tempArray;
                */
                searchableObj.Title = elmt[prop];
                continue;
            }

            if (nameDone === false) {
                tempArray = [];
                tempArray.push(collection[univCounter].Name);
                searchableObj.Name = tempArray;//We store it under the category "Name" Look at Arrange in sections for the exception we created for Name
                nameDone = true;
                if (!dataOfLblsInFltr.hasOwnProperty('Name')) {//We add the property to the database that will keep track of elements in the filter box
                    dataOfLblsInFltr.Name = 0;
                }
                propCounter++;
            }
            if (typeof elmt[prop] === "string") {//New addition
                tempArray = [];
                tempArray.push(elmt[prop]);
                searchableObj[prop] = tempArray;
                if (!dataOfLblsInFltr.hasOwnProperty(prop)) {//We add the property to the database that will keep track of elements in the filter box
                    dataOfLblsInFltr[prop] = 0;
                }
                propCounter++;
                continue;
            }
            if (jQuery.isArray(elmt[prop])) {
                for (var i = 0; i < elmt[prop].length; i++) {
                    if (typeof elmt[prop][i] != "string") {
                        elmt[prop][i].splice(i, 1);
                    }
                }
                if (!dataOfLblsInFltr.hasOwnProperty(prop)) {//We add the property to the database that will keep track of elements in the filter box
                    dataOfLblsInFltr[prop] = 0;
                }
                searchableObj[prop] = elmt[prop];
            }
        }
        if (propCounter > maxProperties) {
            maxProperties = propCounter;
        }
        addObject(searchableObj);
    };
    /********************
    This next function takes in an array and removes the repeated elements in the given
    array, returning a new array.
    ********************/
    var removeDuplicateElement = function (arrayName) {
        var newArray = [];
        label: for (var i = 0; i < arrayName.length; i++) {
            for (var j = 0; j < newArray.length; j++) {
                if (newArray[j] === arrayName[i]) {
                    continue label;
                }
            }
            newArray[newArray.length] = arrayName[i];
        }
        return newArray;
    };

    /*******************
    This following method uses all the posible strings in the collection and creates the
    small database to access the number of pieces under a specfic field.
    ********************/
    var createWorksCounter = function () {
        var allStringsInCol = [];
        var tempArray = [];
        var itElmt = null;
        var i;
        for (i = 0; i < objectsArray.length; i++) {
            itElmt = objectsArray[i];
            for (var prp in itElmt) {
                //We concatenate anything that is an array into a single array
                if (jQuery.isArray(itElmt[prp])) {
                    allStringsInCol = allStringsInCol.concat(itElmt[prp]);
                }
            }
        }
        while (allStringsInCol.length > 0) {
            var firstVal = allStringsInCol[0];//we keep the first value
            miniWorksCounter[firstVal] = 1;
            allStringsInCol.splice(0, 1);//we delete it
            for (i = 0; i < allStringsInCol.length; i++) {
                if (firstVal === allStringsInCol[i]) {//if we find it again
                    miniWorksCounter[firstVal]++;//we increment the database
                    allStringsInCol.splice(i, 1);//then we delete it
                    i--;//we look at the same place because then we would skip an item if we did not do this.
                }
            }
        }
    };
    /**********************
    This function creates the additional objects displayed in the autocomplete.
    These  additional objects are based on the content 
    inside the objects that are in the filteredObjectsArray. These objects are keywords,
    authors, locations, etc.
    **********************/
    var createAdditionalObjects = function () {
        additionalObjectsDatabase = {};
        var additionalStrings = [];
        var newAdditionalObjects = [];
        var counter = 0;
        for (var i = 0; i < filteredObjectsArray.length; i++) {
            var itEl = filteredObjectsArray[i];

            for (var prop in itEl) {
                if (prop === "Thumbnail") {
                    continue;
                }
                if (prop === "Exhibition") {
                    continue;
                }
                if (prop === "Location") {
                    continue;
                }
                if (prop === "__Created") {
                    continue;
                }
                if (prop === "DeepZoom") {
                    continue;
                }
                if (prop === "__LastAccessed") {
                    continue;
                }
                if (prop === "Description") {
                    continue;
                }
                if (prop === "Title") {
                    continue;
                }
                if (prop === "Medium") {
                    continue;
                }
                if (prop === "Type") {
                    continue;
                }
                if (prop === "value") {
                    continue;
                }
                if (prop === "label") {
                    continue;
                }
                else {
                    additionalStrings = additionalStrings.concat(itEl[prop]);
                }
            }
            additionalStrings = removeDuplicateElement(additionalStrings);
            for (var j = 0; j < additionalStrings.length; j++) {
                newAdditionalObjects[j] = {};
                newAdditionalObjects[j].value = additionalStrings[j];
                newAdditionalObjects[j].label = additionalStrings[j].charAt(0).toUpperCase() + additionalStrings[j].substr(1, additionalStrings[j].length);
                counter = 0;
                //This part gives the newly created objects an icon to display.
                //This is a place to look if we are missing images displayed.
                for (var m = 0; m < filteredObjectsArray.length; m++) {
                    var itElmnt = filteredObjectsArray[m];
                    for (var propr in itElmnt) {//all of the properties are arrays
                        if (propr === "Thumbnail") {
                            continue;
                        }
                        if (propr === "Exhibition") {
                            continue;
                        }
                        if (propr === "Location") {
                            continue;
                        }
                        if (propr === "__Created") {
                            continue;
                        }
                        if (propr === "DeepZoom") {
                            continue;
                        }
                        if (propr === "Description") {
                            continue;
                        }
                        if (propr === "__LastAccessed") {
                            continue;
                        }
                        if (propr === "Medium") {
                            continue;
                        }
                        if (propr === "Type") {
                            continue;
                        }
                        if (propr === "Title") {
                            continue;
                        }
                        if (propr === "value") {
                            continue;
                        }
                        if (propr === "label") {
                            continue;
                        }
                        //This loop is giving the icon to display to the newly created objects.
                        for (var p = 0; p < itElmnt[propr].length; p++) {
                            //We are also giving each object the information of what field they belong to
                            $(newAdditionalObjects[j]).data('field', propr);
                            //console.log("The field this object belongs to is: "+ $(newAdditionalObjects[j]).data('field'));

                            if (newAdditionalObjects[j].value === itElmnt[propr][p]) {
                                counter++;
                                newAdditionalObjects[j].Thumbnail = filteredObjectsArray[m].Thumbnail;
                            }
                            if (counter > 0) {
                                break;
                            }
                        }
                        if (counter > 0) {
                            break;
                        }
                    }
                    if (counter > 0) {
                        break;
                    }
                }
                additionalObjectsDatabase[additionalStrings[j]] = newAdditionalObjects[j];
            }
        }
        return newAdditionalObjects;
    };
    /*********************************
    This following method is an accesor, it goes through the database 
    additionalObjectsDatabase that contains all the additional objects
    and returns the objects that meet the filtering criteria.
    **********************************/

    var getAdditionalObjects = function (objectsArray) {
        var additionalObjects = [];
        for (var m = 0; m < objectsArray.length; m++) {
            var element = objectsArray[m];
            for (var prop in element) {
                if (prop === "Thumbnail") {
                    continue;
                }
                if (prop === "Exhibition") {
                    continue;
                }
                if (prop === "Location") {
                    continue;
                }
                if (prop === "__Created") {
                    continue;
                }
                if (prop === "__LastAccessed") {
                    continue;
                }
                if (prop === "DeepZoom") {
                    continue;
                }
                if (prop === "Description") {
                    continue;
                }
                if (prop === "Title") {
                    continue;
                }
                if (prop === "Medium") {
                    continue;
                }
                if (prop === "Type") {
                    continue;
                }
                if (prop === "value") {
                    continue;
                }
                if (prop === "label") {
                    continue;
                }
                if (jQuery.isArray(element[prop])) {

                    for (var i = 0; i < element[prop].length; i++) {
                        additionalObjects.push(additionalObjectsDatabase[element[prop][i]]);
                    }
                }
            }
        }
        additionalObjects = removeDuplicateElement(additionalObjects);
        return additionalObjects;
    };




    /**********************
	This function will create the new objects according to the filter criteria. 
    Here we are using the filtedObjectsArray because this is the array that
    will update itself every time the filter is changed. 
    ***********************/

    var updateSource = function () {
        var hitCounter = 0;
        var element = null;
        var fields = fieldsInResults();
        var additObjects = null;
        var i, j;
        filteredObjectsArray = [];
        for (i = 0; i < objectsArray.length; i++) {
            hitCounter = 0;
            element = objectsArray[i];
            for (var prop in element) {
                //if (jQuery.isArray(element[prop])) {}
                for (j = 0; j < filterResults.length; j++) {
                    if (jQuery.inArray(filterResults[j], element[prop]) > -1) {
                        hitCounter++;
                        break;
                    }
                }
            }
            if (hitCounter === fields) {
                filteredObjectsArray.push(element);
            }
        }

        updateTimeline(filteredObjectsArray);//This method updates the timeline.
        additObjects = getAdditionalObjects(filteredObjectsArray);//This method get the keyword objects of the objects that passed the filter.
        sourceArray = [];
        sourceArray = sourceArray.concat(filteredObjectsArray, additObjects);
        //We need to perform this update too for all the keywords displayed. Otherwise we get undefined in the fields that shouldn't be there becase of the filter
        allObjectKeywords = getAdditionalObjects(objectsArray);
        allKeywords = [];
        allKeywords = allObjectKeywords;

        var indexRepeatedItems = [];
        do {
            indexRepeatedItems = [];
            for (i = 0; i < sourceArray.length; i++) {
                for (j = 0; j < filterResults.length; j++) {
                    if (sourceArray[i].value === filterResults[j]) {
                        indexRepeatedItems.push(i);
                    }
                }
            }
            for (var k = 0; k < indexRepeatedItems.length; k++) {
                sourceArray.splice(indexRepeatedItems[k], 1);
                break;
            }
        }
        while (indexRepeatedItems.length > 0);
    };
    /*************************************************
    This function compiles the properties of all objects and then checks to see 
    how many different fields are in the filter box 
    and then counts all of them in the variable "flds".
    **************************************************/
    var fieldsInResults = function () {
        var filterCounter = {};
        var count = 0;
        var elt = null;
        var flds = 0;
        var filterResCopy = filterResults.slice();
        for (var i = 0; i < objectsArray.length; i++) {
            count = 0;
            elt = objectsArray[i];
            for (var proprty in elt) {
                if (proprty === "Thumbnail") {
                    continue;
                }
                if (proprty === "Exhibition") {
                    continue;
                }
                if (proprty === "__Created") {
                    continue;
                }
                if (proprty === "DeepZoom") {
                    continue;
                }
                if (proprty === "Location") {
                    continue;
                }
                if (proprty === "Description") {
                    continue;
                }
                if (proprty === "Medium") {
                    continue;
                }
                if (proprty === "__LastAccessed") {
                    continue;
                }
                if (proprty === "Type") {
                    continue;
                }
                if (proprty === "Title") {
                    continue;
                }
                if (proprty === "value") {
                    continue;
                }
                if (proprty === "label") {
                    continue;
                }
                if (filterCounter.hasOwnProperty(proprty) === false) {
                    filterCounter[proprty] = 0;
                }
                var len = filterResCopy.length;
                for (var j = 0; j < len; j++) {
                    if (jQuery.inArray(filterResCopy[j], elt[proprty]) > -1) {// We check to see if the value is in the current field of the object we are looking at (the field is an array)
                        if (filterCounter[proprty] === 0) {//If we get it it means that it is there, if its new then we:
                            flds++;//Increment the fields
                            filterCounter[proprty]++;//We increment the counter for that property
                            filterResCopy.splice(j, 1);//We delete that value from our copy
                            len--;
                            j--;
                        }
                        else {
                            filterResCopy.splice(j, 1);
                            len--;
                            j--;
                        }

                        break;
                    }
                }
                count++;
            }
        }
        return flds;
    };
    /*****************
    This function arranges the selected object to the appropriate category 
    in the fieldContainer div. 

    First it checks to see if there is anything at all at the filter div. If there
    is nothing then it automatically creates the new label.
    If there are labels then it loops through them checking to see if the selected
    item belongs to any of them, if it does it adds it to the corresponding label.
    If it does not belong to any then it creates a new label.
    ******************/
    var arrangeInSections = function (object) {
        var label, content, list;
        //console.log("The field it will appear under is: " + $(object).data('field'));
        if (jQuery.inArray(object.value, filterResults) > -1) {
            return false;
        }
        //console.log("The name is " + $(object).data('field'));
        if (!$(object).data('field')) {
            return false;
        }

        if (filterBox[0].firstChild) { //If there is an initial element
            label = $(object).data('field');
            if (label === "Name" || label === "name") {
                label = "Title";
            }
            var compareLabel = label.charAt(0).toUpperCase() + label.substr(1, label.length) + ":"; //we need to create this label bc. we change the uppercase the original string
            var child = filterBox[0].firstChild;
            var trigger = false;
            while (child) {
                var header = child.firstChild.innerHTML;
                if (header === compareLabel) { //If the element I passed belong to the label that is displayed then add it
                    list = child.firstChild.nextSibling;
                    $(list).append("<li class='filters' style='float:left; width: 85%; margin-left: 7.5%; clear:both;'>" + object.value + "</li>");
                    trigger = true;
                    break;
                }
                child = child.nextSibling;
            }
            if (!trigger) {
                var newSection = document.createElement('span');
                $(newSection).attr('class', 'labels');
                filterBox.append(newSection);
                var newlabel = document.createElement('p');
                content = $(object).data('field');
                if (content === 'name' || content === 'Name') { // RL: quick fix to make search consistent w/ heatmap
                    content = 'Title';
                }
                $(newSection).append(newlabel);
                $(newlabel).html(content.charAt(0).toUpperCase() + content.substr(1, content.length) + ":");
                var newlist = document.createElement('ul');
                $(newSection).append(newlist);
                $(newlist).append("<li class='filters' style='float:left; width: 85%; margin-left: 7.5%; clear:both;'>" + object.value + "</li> ");
            }
        }
        else {
            var first = document.createElement('span');
            $(first).attr('class', 'labels');
            filterBox.append(first);
            label = document.createElement('p');
            content = $(object).data('field');
            if (content === 'name' || content === 'Name') { // RL: quick fix to make search consistent w/ heatmap
                content = 'Title';
            }
            $(first).append(label);
            $(label).html(content.charAt(0).toUpperCase() + content.substr(1, content.length) + ":");
            list = document.createElement('ul');
            $(first).append(list);
            $(list).append("<li class='filters' style= 'overflow: hidden; float:left; width: 85%; margin-left: 7.5%; clear:both;'>" + object.value + "</li> ");
        }
        filterResults.push(object.value);
        $('.labels p').css({
            'float': 'left',
            'clear': 'both',
            'padding': 0,
            'margin': 0,
            'font-size': '1.5em',
        });

        $(".filters").button({
            icons: {
                secondary: "ui-icon-circle-close"
            }
        })
        .css({
            'margin-bottom': '3%',
        });

        $('.ui-button-text').css({
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
        });

        $('.labels ul').css(
            {
                'padding': 0,
            }
            );

        //We update our database of objects in labels 
        dataOfLblsInFltr[$(object).data('field')]++;
        //console.log("The number of properties belongign to " + $(object).data('field') + " is " + dataOfLblsInFltr[$(object).data('field')]);
        filterObjects.push(object);
        return true;
    };
    /****
    This function deletes the element in the array filterObjects (this will be stored in the
    exhibitions to keep the current state) that has the "value" property equal to the name of
    the button in the filter box that was deleted. This string name is passed in as a parameter
    to the function. 
    The secondCall variable is a boolean that if true if looks for an first character upper case
    version of the property name to properly eliminate the tag in the box.

    ****/
    var removeObjFromReturnList = function (objValue, propertyName, secondCall) {
        for (var i = 0; i < filterObjects.length; i++) {
            if (filterObjects[i].label == objValue) {
                filterObjects.splice(i, 1);
            }
        }
        dataOfLblsInFltr[propertyName]--;
        if (dataOfLblsInFltr[propertyName] === 0) {//We eliminate the label in the box
            if (secondCall === true) {
                propertyName = propertyName.charAt(0).toUpperCase() + propertyName.substr(1, propertyName.length);
            }
            var span = filterBox[0].firstChild;//span containing <p> and <ul>
            while (span) {
                var label = span.firstChild.innerHTML;
                label = label.replace(":", "");
                if (propertyName === "Name") {//Dealing with the exception fo Name and Title
                    propertyName = "Title";
                }
                if (label === propertyName) { //If the element I passed belong to the label that is displayed then add it
                    $(span).remove();
                    break;
                }
                span = span.nextSibling;
            }
            if (filterBox[0].firstChild === null) {
                filterBox.css('visibility', 'hidden');
            }
        }
        //console.log("The number of properties belongign to " + objValue + " is " + dataOfLblsInFltr[propertyName]);
    };

    var updateTimeline = function (passableObjects) {
        //We need to compare them with the ones that are in the collection and return the filtered ones.
        //The restriction is placed by the one with fewer arguments
        //We compare with max properties
        timelineObjects = [];
        var propCount; //Counts the properties
        var matchCount; //Counts the matches
        for (var i = 0; i < collection.length; i++) {
            for (var j = 0; j < passableObjects.length; j++) {
                var compObj = passableObjects[j];
                propCount = 0;
                matchCount = 0;
                for (var prop in compObj) {
                    if (prop === "value") {
                        continue;
                    }
                    if (prop === "label") {
                        continue;
                    }
                    if (prop === 'Name') {
                        continue;
                    }
                    if (prop === 'Medium') {
                        continue;
                    }
                    if (prop === '__LastAccessed') {
                        continue;
                    }
                    if (prop === 'Type') {
                        continue;
                    }
                    propCount++;
                    var str1 = compObj[prop].toString();//string of passable array
                    var str2;
                    if (collection[i].Metadata.hasOwnProperty(prop)) {
                        str2 = collection[i].Metadata[prop].toString();//string of collection array
                        //console.log("The strings we are comparing are: " + str1 + " and " + str2);
                    } else {
                        str2 = 0;
                    }
                    if (str1 === str2) {
                        matchCount++;
                    }
                }

                if (propCount === matchCount) {
                    timelineObjects.push(collection[i]);
                    break;
                }
            }
        }
        timeline.draw(timelineObjects);
    };



    /************************************
    The following function creates the autocomplete widget and styles it.
    ************************************/
    searchInput.onfocus = function () {
        $(searchInput).autocomplete({
            minLength: 0,
            source: allKeywords,
            open: function (event, ui) {
                $(".ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all").position({
                    of: search,
                    my: "left top",
                    at: "left bottom",
                    offset: "-64% 20%",//adjust according to screen resolution.
                    collision: "none"
                });
                //Makes align to the right
                $('.ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all').css({
                    'left': '',
                    'right': '0',
                    'z-index': 91
                });
                $("span.item_name").css({
                    'white-space': 'nowrap',
                    'overflow': 'hidden',
                    'text-overflow': 'ellipsis',
                    'z-index': 101
                });
                $('.ui-menu-item').css({
                    'width': $('.ui-menu-item').width() * 0.93,
                    'right': '10%',
                    'overflow': 'hidden',
                    'text-overflow': 'ellipsis',
                    'z-index':101
                });
                //console.log("The value of the length of the div is: " + $('.ui-menu-item').width());
                //Makes background exact size as list.
                $("#backgroundSearch").css({
                    'width': $('.ui-menu-item').width() * 1.1,
                    'visibility': 'visible'
                });
                $(".sortContainer").css({
                    visibility: 'hidden'
                });

            },
            focus: function (event, ui) {
                if (ui.item) {
                    $(searchInput).val(ui.item.label);
                }
                return false;
            },
            select: function (event, ui) {
                if (filterBox.css('visibility') === "hidden") {
                    filterBox.css('visibility', 'visible');
                }
                //var indexItem = filterResults.indexOf(ui.item.value)
                this.value = "";//resets the textbox to have nothing on it.

                //arrangeInSections returns true (-> proceed with normal execution) or false (->omit normal execution) depending if the user tried to click something already displayed
                var normalExecution = arrangeInSections(ui.item);//This method creates the keywords under the appropriate label


                //Without this following assignment the background is not applied correctly
                //in the filterContainer div when the list overflows
                //This happens for no particlar reason I can discern

                if (filterBox.css('overflow-y') === "auto") {
                    filterBox.css('overflow-y', 'scroll');
                }
                else {
                    filterBox.css('overflow-y', 'auto');
                }
                //This following method gives the small "x" icon the functionality to delete
                //the whole button when pressed, as well as removing the value from the 
                //filterResults array
                if (normalExecution) {
                    $(".filters").unbind('click');
                    $(".filters").on("click", function () {
                        var wordRemoved = $(this).button("option", "label");
                        var nameInLabelDatabase = $(this).parent()[0].previousSibling.innerHTML;
                        nameInLabelDatabase = nameInLabelDatabase.replace(":", "");
                        if (nameInLabelDatabase === "Title") {
                            nameInLabelDatabase = "Name";
                        }

                        if (dataOfLblsInFltr.hasOwnProperty(nameInLabelDatabase)) {
                            removeObjFromReturnList(wordRemoved, nameInLabelDatabase, false);//this last boolean specifies if it is the first or second call on this same label.
                        } else {
                            nameInLabelDatabase = nameInLabelDatabase.charAt(0).toLowerCase() + nameInLabelDatabase.substr(1, nameInLabelDatabase.length);
                            removeObjFromReturnList(wordRemoved, nameInLabelDatabase, true);
                        }
                        var indexItem = filterResults.indexOf(wordRemoved);
                        //$('#' + indexItem.toString()).remove();//Removes the line break added.
                        filterResults.splice(indexItem, 1);
                        updateSource();
                        search.autocomplete("option", "source", allKeywords);

                        //this following loop checks to see if the labels have something under them
                        //if they do not then the whole span is deleted.
                        $(this).remove();

                    });
                    updateSource();
                    //console.log(sourceArray);
                    $(searchInput).autocomplete("option", "source", allKeywords);
                }
                return false;
            },
        })
        .data("autocomplete")._renderItem = function (ul, item) {
            var li = $(document.createElement('li'));
            li.data("item.autocomplete", item);

            var link = $(document.createElement('a'));
            link.attr('class', 'label_names');

            var img = $(document.createElement('img'));
            img.css({
                'height': '3em',
                'width': '3em',
                'margin-top': '3%',
                'margin-bottom': '3%',
                'margin-left': '5%',
            });
            img.attr('src', LADS.Worktop.Database.fixPath(item.Thumbnail));

            var span = $(document.createElement('span'));
            span.attr('class', 'item_name');
            span.css({
                'position': 'relative',
                'width': '9.5em',
                'right': '0em',
                'text-align': 'right',
                'top': '-0.5em',
                'font-size': '120%',
                'z-index': '100',
                'float': 'right',
            });

            var par = $(document.createElement('p'));
            par.html(item.label + "<br />" + miniWorksCounter[item.value] + " works </p>");

            span.append(par);
            link.append(img).append(span);
            li.append(link);
            $(ul).append(li);
            return li;

        };

        //Button css
        $(".filters").css({
            'background-image': 'none',
            'background-color': 'rgb(79,83,79)',
            'border-width': '0px',
            'color': 'white',
            'font-weight': 'normal'
        });

        $(".ui-autocomplete a:link").css({
            'color': 'black'
        });
        $(".ui-autocomplete a:visited").css({
            'color': 'black'
        });
        $(".ui-autocomplete a:hover").css({
            'color': 'black'
        });
        $(".ui-autocomplete a:active").css({
            'color': 'black'
        });
        $(".ui-autocomplete ::selection").css({
            'color': 'black'
        });
        //sets the background div
        $("#backgroundSearch").css({
            'z-index': '50',
        });

        //This one works by letting the background appear even if the user is holding the mouse click
        $(".ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all").hover(function () {
            $("#backgroundSearch").css({
                'z-index': '50',
                'visibility': 'visible'
            });
            $("#sortSelector").css({
                visibility: 'hidden'
            });
        });

        //----------------------------------------------------
        //Sets the background div that displays the search results'
        $(".ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all").css({
            'position': 'absolute',
            'background-image': 'none',
            'background-color': 'rgba(0,0,0,0)',
            'padding': '0',
            'border': '0',
            'margin': '0',
        });

        //Changes the font color when its on focus
        search.css({
            'color': 'rgb(0,0,0)',
        });
        ////TODO GUI CSS
        //Eliminates the value of the input field when the user clicks on the input box.
        search[0].value = "";

        //Sets the srollbar
        $(".ui-autocomplete").css({
            'position': 'absolute',
            'overflow-y': 'auto',
            'overflow-x': 'hidden',
            'min-width': '22%',
            'max-height': '85%'
        });

        //The method right below works but its not helpful
        $(".ui-autocomplete:hover").css({
            'background-image': 'none',
            'background-color': 'none'
        });
        $(".ui-autocomplete.ui-menu.ui-widget.ui-widget-content.ui-corner-all::focus").css({
            'background-image': 'none',
            'background-color': 'blue'
        });


        $("li.ui-menu-item:focus").css({
            'background-color': 'blue'
        });

    };
    searchInput.onblur = function () {
        $("#backgroundSearch").css({
            'visibility': 'hidden'
        });
        search[0].value = "Keyword search";
        search.css({
            'color': 'rgb(120,128,119)'
        });
        $(".sortContainer").css({
            visibility: 'visible'
        });
    };

    processObjects(collection);//This call begins the whole process.
};