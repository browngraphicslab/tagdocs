/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

window.rin = window.rin || {};
(function (rin, $) {

    // ES for displaying a Image Comparison Slider
    var ImageCompareES = function (orchestrator, esData) {
        ImageCompareES.parentConstructor.apply(this, arguments);

        // by default slider starts in the middle
        this.percent = 50;

        var resolver = orchestrator.getResourceResolver(),
            resources = esData.resourceReferences,
            experienceId = esData.experienceId;

        // TODO: is it safe to assume resources are always ordered?
        this.leftImageUrl = resolver.resolveResource(resources[0].resourceId, experienceId);
        this.rightImageUrl = resolver.resolveResource(resources[1].resourceId, experienceId);

        this.imageWidth = 0;
        this.imageHeight = 0;

        // NOTE: right image goes first since only the left element changes size
        this.el = rin.util.createElementWithHtml(
            '<div class="rin-ic-center">' +
                '<div class="rin-ic-right"></div>' +
                '<div class="rin-ic-left"></div>' +
                '<div class="rin-ic-slider">' +
                    '<div class="rin-ic-sliderbar"></div>' +
                '</div>' +
            '</div>');

        // cache parent element references
        this.$el = $(this.el).addClass('rin-ic');
        this.$center = this.$el.find('.rin-ic-center');

        // set image backgrounds
        this.$left = this.$el.find('.rin-ic-left')
            .css('background-image', 'url(' + this.leftImageUrl + ')');
        this.$right = this.$el.find('.rin-ic-right')
            .css('background-image', 'url(' + this.rightImageUrl + ')');

        // indicates whether user is controlling slider
        this.interactiveSlide = false;

        // listen to slide start drag by user
        this.$slider = this.$el.find('.rin-ic-slider')
            .on('pointerstart', $.proxy(function() {
                orchestrator.startInteractionMode();
                this.interactiveSlide = true;
            }, this));

        // we listen to slide events on parent element because the
        // slider element is too narrow, its easy for the user to
        // drag faster than we can update the position. we don't
        // want the drag to end until they leave the parent element
        this.$el.on('pointerstart pointermove pointerend', $.proxy(function(event) {

            // stop event propagation to prevent manipulation of page
            if (event.type === 'pointermove') {
                event.preventDefault();
            }

            if (!this.interactiveSlide) {
                return;
            } else if (event.type === 'pointerend') {
                this.interactiveSlide = false;
            }

            var offset = this.$center.offset(),
                width = this.$center.width(),
                x = event.pointer.x - offset.left,
                percent = x / width * 100;

            this.setPercent(percent);
        }, this));

        this.sliderBarLeft = 100;

        //Set up defaultKeyframe
        esData.data = esData.data || {};
        esData.data.defaultKeyframe = esData.data.defaultKeyframe ||
            { "state": { "percent" : this.percent } };
    };

    rin.util.extend(rin.contracts.InterpolatedKeyframeESBase, ImageCompareES);

    ImageCompareES.prototypeOverrides = {

        // Load and initialize the ES.
        load: function (experienceStreamId) {

            this.addSliverInterpolator("percent", function (sliverId, state) {
                return new rin.Ext.Interpolators.linearDoubleInterpolator(
                    sliverId, state);
            });

            this.windowResize = $.proxy(this.resize, this);
            $(window).on('resize', this.windowResize);

            // Call load on parent to init the keyframes.
            ImageCompareES.parentPrototype.load.call(this, experienceStreamId);
            this.setState(rin.contracts.experienceStreamState.buffering);

            // buffering state until both left and right images are loaded
            var leftImage = new Image(),
                rightImage = new Image(),
                loadCount = 0,
                TOTAL_IMAGES = 2,
                onImageLoaded = $.proxy(function() {
                    loadCount++;
                    if (loadCount === TOTAL_IMAGES) {
                        this.resize();
                        // signal to RIN that we are ready
                        this.setState(rin.contracts.experienceStreamState.ready);
                    }
                }, this);

            rightImage.onload = onImageLoaded;
            rightImage.src = this.rightImageUrl;

            // load the left image to get dimensions (assume identical size for right)
            leftImage.onload = $.proxy(function() {
                this.imageWidth = leftImage.width;
                this.imageHeight = leftImage.height;
                onImageLoaded();
            }, this);
            leftImage.src = this.leftImageUrl;
        },

        addedToStage: function() {

            // TODO: better way to hide the player controls if inside an popup?
            this.$el.parents('.rin_popup_es_container')
                .find('.rin_Footer').addClass('rin_hide_footer');

            // intermittent issues with directly calling resize. might be
            // triggered by fade-in delays? need to investigate further
            setTimeout(this.windowResize, 100);
        },

        unload: function() {
            $(window).off('resize', this.windowResize);
        },

        getUserInterfaceControl: function() {
            return this.el;
        },

        resize: function() {

            // wait until we know the image dimensions
            if (!this.imageWidth || !this.imageHeight) {
                return;
            }

            var parentWidth = this.$el.width(),
                parentHeight = this.$el.height(),
                parentAspect = parentWidth / parentHeight,
                imageAspect = this.imageWidth / this.imageHeight,
                scaledWidth, scaledHeight, offset;

            // identify how to scale and letterbox the images
            if (parentAspect > imageAspect) {
                scaledWidth = Math.ceil(parentHeight * imageAspect);
                scaledHeight = parentHeight;
                offset = Math.round((parentWidth - scaledWidth) / 2),
                this.$center.css({ left: offset, right: offset });
            } else {
                scaledWidth = parentWidth;
                scaledHeight = Math.ceil(parentWidth / imageAspect);
                offset = Math.round((parentHeight - scaledHeight) / 2),
                this.$center.css({ top: offset, bottom: offset });
            }

            // scale the two images
            var bgSize = scaledWidth + 'px ' + scaledHeight + 'px';
            this.$left.css('background-size', bgSize);
            this.$right.css('background-size', bgSize);

            // reset the slider position
            this.setPercent(this.percent);
        },

        pause: function (offset, experienceStreamId) {
            // Call pause on parent to sync the keyframes.
            ImageCompareES.parentPrototype.pause.call(this, offset, experienceStreamId);
        },

        displayKeyframe: function (keyframeData) {

            var READY = rin.contracts.experienceStreamState.ready;
            if (this.getState() !== READY || !keyframeData.state) {
                return; //if not ready, do nothing
            }

            this.setPercent(keyframeData.state.percent);
        },

        setPercent: function(percent) {
            this.percent = Math.max(0, Math.min(percent, 100));
            var width = this.$center.width(),
                leftWidth = Math.floor(width * this.percent / 100);

            this.$left.width(leftWidth);
            this.$slider.css('left', leftWidth - this.sliderBarLeft);
        },

        captureKeyframe: function () {
            return { "state": { "percent": this.percent } };
        },

        isExplorable: true
    };

    rin.util.overrideProperties(
        ImageCompareES.prototypeOverrides,
        ImageCompareES.prototype);

    rin.ext.registerFactory(
        rin.contracts.systemFactoryTypes.esFactory,
        "MicrosoftResearch.Rin.ImageCompareExperienceStream",
        function (orchestrator, esData) {
            return new ImageCompareES(orchestrator, esData);
        });

})(rin, jQuery);
