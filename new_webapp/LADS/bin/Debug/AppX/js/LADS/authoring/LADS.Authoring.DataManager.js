LADS.Util.makeNamespace("LADS.Authoring.DataManager");

/* This class is responsible for managing the interaction with the server and 
    returning the relevant information. It is also responsible for keeping track of the
    default layouts for the exhibition mode and the general settings mode. */
LADS.Authoring.DataManager = function () {

    var generalTemplate, dataArray;

    init();

    function init() {


        var overlayColor = $("<div/>");
        var overlayColorText = $('<div>Overlay Color </div>');
        var overlayColorButton = $('<div></div>');

        overlayColorButton.css("float", "right").css('margin-right', '15%').css("padding", "2% 2%").css("background-color", "rgb(63,55,53)").css("color", "white").css("font-size", "large");
        overlayColorText.css('float', 'left');

        overlayColor.append(overlayColorText);
        overlayColor.append(overlayColorButton);

        // Define this according to Wil's implementation
        var splashScreenLayout = new Array(
        {
            field: "Background Image ", type: "file"
        },
        {
            field: overlayColor, type: "custom"
        },
        {
            field: "Overlay Transparency", type: "slider"
        }
        );

        var museumInfoLayout = new Array(
        {
            field: "Museum Name ", type: "text"
        },
        {
            field: "Subheading ", type: "text"
        },
        {
            field: "Logo ", type: "file"
        },
        {
            field: "Museum Info ", type: "textarea"
        }
        );

        // Define this according to Wil's implementation
        generalTemplate = new Array(
        {
            name: "General Settings", layout: {}, data: null
        },
        {
            name: "Splash Screen", layout: splashScreenLayout, data: null
        },
        {
            name: "Museum Info", layout: museumInfoLayout, data: null
        }
        );

        var publish = $("<div/>");
        var unpublishButton = $('<div>Unpublish</div>');
        var publishButton = $('<div>Publish</div>');

        publishButton.css("float", "right").css('margin-right', '2%').css("padding", "2% 2%").css("background-color", "rgb(34,110,57)").css("color", "white").css("font-size", "large");
        unpublishButton.css("float", "right").css('margin-right', '15%').css("padding", "2% 2%").css("background-color", "rgb(34,110,57)").css("color", "white").css("font-size", "large");

        publish.append(unpublishButton);
        publish.append(publishButton);

        publish.css("padding-bottom", "25%");



        // This remains fixed for the exhibitions settings page.
        var layoutArray = new Array({ field: "Heading 1: ", type: "text" },
        {
            field: "Heading 2: ", type: "text"
        },
        {
            field: "Heading 3: ", type: "text"
        },
        {
            field: "Image 1: ", type: "file"
        },
        {
            field: "Image 2: ", type: "file"
        },
        {
            field: "Description: ", type: "textarea"
        },
        {
            field: publish, type: "custom"
        });


        // The null values will be replaced by return values from the database.
        dataArray = new Array({ name: "Exhibition Settings", layout: {}, data: null },
        {
            name: "Made in the UK", layout: layoutArray, data: null
        },
        {
            name: "Nancy Chunn", layout: layoutArray, data: null
        },
        {
            name: "Jeremy Deller", layout: layoutArray, data: null
        },
        {
            name: "Jacques Callort", layout: layoutArray, data: null
        },
        {
            name: "Building Blocks", layout: layoutArray, data: null
        },
        {
            name: "Distant Climes", layout: layoutArray, data: null
        },
        {
            name: "Japanese Robes", layout: layoutArray, data: null
        },
        {
            name: "Japanese Prints", layout: layoutArray, data: null
        },
        {
            name: "Subject to Change", layout: layoutArray, data: null
        },
        {
            name: "Ancient and Medieval", layout: layoutArray, data: null
        },
        {
            name: "Impressionism", layout: layoutArray, data: null
        },
        {
            name: "Pendleton House", layout: layoutArray, data: null
        },
        {
            name: "A Grand Gallery", layout: layoutArray, data: null
        },
        {
            name: "American Art", layout: layoutArray, data: null
        });
    }

    // Returns the layout for the general settings mode
    //this.getGeneralMode = function() {
    //    return generalTemplate;
    //}

    // Returns the layout for the exhibition settings mode
    //this.getExhibitionMode = function() {
    //    return dataArray;
    //}

    this.getLayout = function (layoutType) {
        if (layoutType == 'general') {
            return generalTemplate;
        }
        else if (layoutType == 'exhibitions') {
            return dataArray;
        }
        else {
            return null;
        }
    };

    // When implemented, this function will write back the updated exhibition information to the database.
    this.updateExhibition = function () { };

    // When implemented, this function will write back the updated settings to the database.
    this.updateSettings = function () { };
};