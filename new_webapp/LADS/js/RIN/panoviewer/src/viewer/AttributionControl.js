/**
 * This is a simple control for showing image attribution
 * with creative common copyrights. It surfaces links to those
 * licenses, if no attribution is set, nothing is visible.
 * @constructor
 * @param {HTMLElement}  parentDiv
 */
var AttributionControl = function(parentDiv) {
    var self = this;
    self.lastAttribution = null;


    //This control is laid out as follows
    //
    // ---------------------------------------------------------------------------------------------
    // |  Publisher Text                                                                           |
    // |   ByIcon  | NC_icon  | ND_icon  | SA_Icon | PD_icon | Copyright_icon  |  Author Link Text |
    // ---------------------------------------------------------------------------------------------
    //
    // Depending on license we going to toggle the visiblity of the icons.
    // We also update links to point to the creative commons website
    //
    var layout = ['<div id="attributionControl" class="panoramaAttributionControl panoramaAttributionControlContainer" >',
                  '<span id="publisherText"class="panoramaAttributionControl panoramaAttributionControlText" ><br/></span>',
                  '<a id="icon_anchor" class="panoramaAttributionControl"  target="_blank">',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="by_icon"/>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="nc_icon"/>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="nd_icon"/>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="sa_icon"/>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="pd_icon"/>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="copyright_icon"/></a>',
                  '<a class="panoramaAttributionControl" id="authorTextAnchor" href="" target="_blank"><span class="panoramaAttributionControl panoramaAttributionControlText"  id="authorText"></span></a>',
                  '<span class="panoramaAttributionControl panoramaAttributionControlText"  id="authorTextNoAnchor"></span>',
                  '</div>'].join(' ');

    //TODO look up non-jquery way to do this.
    var $control = $(layout).hide();
    $control.appendTo($(parentDiv));
    $control.css({'display':'block'});

    //We use these table to populate
    //the Createive Commons related icons and links.
    var allIcons = ['pd_icon', 'by_icon', 'sa_icon', 'nc_icon', 'nd_icon', 'copyright_icon'];

    var ccAttributionType = {
        publicDomain : {
            pattern:'/publicdomain/',
            text:'This work is identified as Public Domain.',
            url:'http://creativecommons.org/licenses/publicdomain/',
            iconsToShow: ['pd_icon']
        },
        by : {
            pattern:'/by/',
            text: 'This work is licensed to the public under the Creative Commons Attribution license.',
            url:'http://creativecommons.org/licenses/by/3.0/',
            iconsToShow: ['by_icon']
        },
        bySa : {
            pattern:'/by-sa/',
            text:'This work is licensed to the public under the Creative Commons Attribution-ShareAlike license.',
            url:'http://creativecommons.org/licenses/by-sa/3.0/',
            iconsToShow: ['by_icon','sa_icon']
        },
        byNd : {
            pattern:'/by-nd/',
            text:'This work is licensed to the public under the Creative Commons Attribution-NoDerivatives license.',
            url:'http://creativecommons.org/licenses/by-nd/3.0/',
            iconsToShow: ['by_icon','nd_icon']
        },
        byNc : {
            pattern:'/by-nc/',
            text:'This work is licensed to the public under the Creative Commons Attribution-Non-commercial license.',
            url:'http://creativecommons.org/licenses/by-nc/3.0/',
            iconsToShow: ['by_icon','nc_icon']
        },
        byNcSa : {
            pattern:'/by-nc-sa/',
            text: 'This work is licensed to the public under the Creative Commons Attribution-Non-commercial-ShareAlike license.',
            url:'http://creativecommons.org/licenses/by-nc-sa/3.0/',
            iconsToShow: ['by_icon','nc_icon','sa_icon']
        },
        byNcNd : {
            pattern:'/by-nc-nd/',
            text:'This work is licensed to the public under the Creative Commons Attribution-Non-commercial-NoDerivatives license.',
            url:'http://creativecommons.org/licenses/by-nc-nd/3.0/',
            iconsToShow: ['by_icon','nc_icon','nd_icon']
        },
        copyright: {
            pattern:'',
            text:'This work is copyrighted.',
            url:'',
            iconsToShow: ['copyright_icon']
        }
    };

    var hideUI = function() {
        $control.hide();
    };

    var updateUI = function(attribution) {
        var k,
            i,
            icon,
            attributionType = ccAttributionType.copyright;

        $control.show();

        //Hide all text.
        $('#publisherText', $control).hide().text('');
        $('#authorText', $control).hide().text('');
        $('#authorTextAnchor', $control).hide().attr('href','').attr('title','');
        $('#authorTextNoAnchor', $control).hide().text('');
        //Hide all icons
        for(i = 0 ; i < allIcons.length; ++i) {
            $('#'+allIcons[i], $control).hide();
        }
        $('#icon_anchor', $control).attr('href', '').attr('title','');

        for(k in ccAttributionType) if(ccAttributionType.hasOwnProperty(k)) {
            if(attribution &&
               attribution.licenseUrl &&
               attribution.licenseUrl.indexOf(ccAttributionType[k].pattern) != -1)  {
                attributionType = ccAttributionType[k];
                break;
            }
        }

        for(i = 0; i < attributionType.iconsToShow.length; ++i) {
            icon = attributionType.iconsToShow[i];
            $('#' + icon, $control).show();
        }
        $('#icon_anchor', $control).attr('title', attributionType.text);
        $('#icon_anchor', $control).attr('href', attributionType.url);

        if(!attribution.author && attribution.publisher) {
            $('#publisherText', $control).hide().text('');
            if(attribution.attributionUrl) {
                $('#authorText', $control).show().text(attribution.publisher);
                $('#authorTextAnchor', $control).show().attr('href', attribution.attributionUrl);
                $('#authorTextAnchor', $control).show().attr('title', attribution.attributionUrl);
            } else {
                $('#authorTextNoAnchor', $control).show().text(attribution.publisher);
            }
        } else  {
            if(attribution.publisher) {
                $('#publisherText', $control).show().text(attribution.publisher);
            } else {
                $('#publisherText', $control).hide().text('');
            }
            if(attribution.author) {
                if(attribution.attributionUrl) {
                    $('#authorText', $control).show().text(attribution.author);
                    $('#authorTextAnchor', $control).show().attr('href', attribution.attributionUrl);
                    $('#authorTextAnchor', $control).show().attr('title', attribution.attributionUrl);
                } else {
                    $('#authorTextNoAnchor', $control).show().text(attribution.author);
                }
            }
        }
    };

    /**
     * This updates the attribution information
     * @param {{author:string, publisher:string,attributionUrl:string, licenseUrl:string}} attribution
     */
    self.setAttribution = function(attribution) {
        if((self.lastAttribution != null &&
            attribution.author === self.lastAttribution.author &&
            attribution.publisher === self.lastAttribution.publisher &&
            attribution.attributionUrl === self.lastAttribution.attributionUrl &&
            attribution.licenseUrl === self.lastAttribution.licenseUrl) ||
            self.lastAttribution === null) {
            //updateUI(attribution); // TODO: narend: Temporarily commented for Everest. This gives exceptions in Safari and fails in ipad. After everest, this needs to be looked at.
            self.lastAttribution = attribution;
        }
    };

    /**
     * remove the attribution UI.
     */
    self.clearAttrubution = function() {
        self.lastAttribution = null;
        hideUI();
    };

    self.dispose = function() {
        if($control) {
            $control.remove()
        }
    }
};
