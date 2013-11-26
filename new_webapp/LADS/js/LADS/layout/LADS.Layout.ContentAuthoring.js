LADS.Util.makeNamespace("LADS.Layout.ContentAuthoring");

/**
*This is the layout for entering from startpage to authoring mode.
**/
LADS.Layout.ContentAuthoring = function () {
    "use strict";

    this.getRoot = function () {
        return root;
    };

    var root = $(document.createElement('div'));
    var mainPanel = $(document.createElement('div'));

    (function init() {

        root.css("background-color", "rgb(219,217,204)");
        root.css("color", "black");
        root.css("width", "100%");
        root.css("height", "100%");

        mainPanel.css({ width: '100%', height: 100 + '%' });
        /**
        *Change the view 
        *@param: the selected section.
        **/
        function ChangeView(layout) {
            mainPanel.empty();
            if (layout) mainPanel.append(layout.getRoot());
        }
        /*show General setting*/
        function GeneralSettings() {
            new ChangeView((new LADS.Authoring.SettingsView()));
        }
        /*generate exhibition setting*/
        function ExhibitionSettings() {
            new ChangeView((new LADS.Authoring.SettingsView('exhibitions')));
        }

        //this has never been called, but keep it for now for later use...
        //function NotImplemented() {
        //    ChangeView();
        //}

        root.append(mainPanel);
        new GeneralSettings();
    })();

};

