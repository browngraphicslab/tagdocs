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
    // ---------------------------------------------------------------------------------------------------------------
    // |   ByIcon  | NC_icon  | ND_icon  | SA_Icon | PD_icon | Copyright_icon  |  Author Link Text - Publisher Text  |
    // ---------------------------------------------------------------------------------------------------------------
    //
    // Depending on license we going to toggle the visiblity of the icons.
    // We also update links to point to the creative commons website
    //
    var layout = ['<div id="attributionControl" class="panoramaAttributionControl panoramaAttributionControlContainer" >',
                  '<a id="icon_anchor" class="panoramaAttributionControl">',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="by_icon"></div>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="nc_icon"></div>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="nd_icon"></div>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="sa_icon"></div>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="pd_icon"></div></a>',
                  '<div class="panoramaAttributionControl  panoramaAttributionControlIcon" id="copyright_icon"></div>',
                  '<a class="panoramaAttributionControl" id="authorTextAnchor" href=""><span class="panoramaAttributionControl panoramaAttributionControlText"  id="authorText"></span></a>',
                  '<span class="panoramaAttributionControl panoramaAttributionControlText"  id="authorTextNoAnchor"></span>',
                  '<span class="panoramaAttributionControl panoramaAttributionControlText" id="attributionDash">&ndash;</span>',
                  '<span id="publisherText"class="panoramaAttributionControl panoramaAttributionControlText" ></span>',
                  '</div>'].join(' ');


    var domAttributePrefix = "$$$$";

    var div = document.createElement('div');
    parentDiv.appendChild(div);

    //if running in a win8 app, we need to set the innerHTML inside this method
    if (typeof MSApp == 'object' && MSApp.execUnsafeLocalFunction) {
        MSApp.execUnsafeLocalFunction(function () { div.innerHTML = layout; });
    }
    else {
        div.innerHTML = layout;
    }

    parentDiv.removeChild(div);
    var controlDiv = div.firstChild;
    parentDiv.appendChild(controlDiv);

    // All of the code below should use jQuery instead of these mickymouse grade helpers.
    // However -- some partner teams don't want the dependency.
    var hide = function(element) {
        if(!element[domAttributePrefix + 'displayValue']) {
            var  oldValue = element.style.display || window.getComputedStyle(element, null).getPropertyValue('display');
            element[domAttributePrefix + 'displayValue'];
        }
        Utils.css(element, {display:'none'});
    };

    var show = function(element) {
        var originalValue = element[domAttributePrefix + 'displayValue'] || ((element.tagName === 'A' || element.tagName === 'SPAN')? 'inline': 'inline-block');
        Utils.css(element, {display:originalValue});
        self.updatePosition();
    };

    this.updatePosition = function () {
        var top = parentDiv.offsetHeight - controlDiv.offsetHeight - 10;
        controlDiv.style.top = top + "px";
    };

    var qs = function(id, rootElement) {
        if(!rootElement) {
            rootElement = document;
        }
        return rootElement.querySelector(id);
    };

    var text = function(element, value) {
        element.innerHTML = value;
    };

    Utils.css(controlDiv, {'display':'block'});
    hide(controlDiv);

    //We use these table to populate
    //the Creative Commons related icons and links.
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
        hide(controlDiv);
    };

    var updateUI = function(attribution) {
        var k,
            i,
            icon, el,
            attributionType = ccAttributionType.copyright;

        hide(controlDiv);

        //Hide all text.
        el = qs('#publisherText', controlDiv);
        hide(el);
        text(el, '');

        el = qs('#authorText', controlDiv);
        hide(el);
        text(el, '');

        el = qs('#authorTextAnchor', controlDiv);
        hide(el);
        el.title = '';
        el.href = '';

        el = qs('#authorTextNoAnchor', controlDiv);
        hide(el);
        text(el, '');

        el = qs('#attributionDash', controlDiv);
        hide(el);

        //Hide all icons
        for(i = 0 ; i < allIcons.length; ++i) {
            el = qs('#'+allIcons[i], controlDiv);
            hide(el);
        }
        el = qs('#icon_anchor', controlDiv);
        el.href = '';
        el.title = '';

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
            el = qs('#' + icon, controlDiv);
            show(el);
        }
        el = qs('#icon_anchor', controlDiv);
        el.title = attributionType.text;
        el.href  = attributionType.url || attribution.attributionUrl;

        if(!attribution.author && attribution.publisher) {
            el = qs('#publisherText', controlDiv);
            hide(el);
            text(el, '');
            if(attribution.attributionUrl) {
                el = qs('#authorText', controlDiv);
                show(el);
                text(el, attribution.publisher);

                el = qs('#authorTextAnchor', controlDiv);
                show(el);
                el.href = attribution.attributionUrl;
                el.title = attribution.attributionUrl;
            } else {
                el = qs('#authorTextNoAnchor', controlDiv);
                show(el);
                text(el, attribution.publisher);
            }
        } else  {
            if(attribution.publisher) {
                el = qs('#publisherText', controlDiv);
                show(el);
                text(el, attribution.publisher);
                el = qs('#attributionDash', controlDiv);
                show(el);
            } else {
                el = qs('#publisherText', controlDiv);
                hide(el);
                text(el, '');
            }
            if(attribution.author) {
                if(attribution.attributionUrl) {
                    el = qs('#authorText', controlDiv);
                    show(el);
                    text(el, attribution.author);
                    el = qs('#authorTextAnchor', controlDiv);
                    show(el);
                    el.href = attribution.attributionUrl;
                    el.title = attribution.attributionUrl;
                } else {
                    el = qs('#authorTextNoAnchor', controlDiv);
                    show(el);
                    text(el, attribution.author);
                }
            }
        }
        show(controlDiv);
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
     * clear the attribution UI state.
     */
    self.clearAttribution = function() {
        self.lastAttribution = null;
        hideUI();
    };

    /**
     * Removed the UI from the DOM and cleans up.
     */
    self.dispose = function() {
        if(controlDiv && controlDiv.parentNode) {
            controlDiv.parentNode.removeChild(controlDiv);
            controlDiv = null;
        }
    }
};
