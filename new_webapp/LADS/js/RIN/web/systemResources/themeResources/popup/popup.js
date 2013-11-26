rin.PopupControl.View = function (rootBase, width, height) {
    var $rootControl = $(rootBase);
    var $escontainer = $rootControl.find('.rin_popup_es_container');
    var $escontrols = $rootControl.find('.rin_popup_controls');
    var $descContainer = $rootControl.find('.rin_popup_CBDescription');
    var $desc_collapse = $rootControl.find('.rin_popup_DescButton');
    var firstTimeLoad = true;
    var finalWidth = width || $rootControl.width();
    var finalHeight = height || $rootControl.height();
    this.esControl = null;
    var isDescVisible = true;

    $rootControl.offset({ top: finalHeight / 4, left: finalWidth / 4 });

    $desc_collapse.click(function () {
        if (isDescVisible)
            $descContainer.fadeOut(300, 'easeOutQuint');
        else
            $descContainer.fadeIn(300, 'easeOutQuint');
        
        isDescVisible = !isDescVisible;
    });

    this.showES = function (esControl, interactionControls) {
        this.esControl = esControl;
        $escontainer.append(esControl);
        if (firstTimeLoad) {
            firstTimeLoad = false;
            $rootControl.animate({ 'width': '100%',
                'height': '100%',
                'left': '0px',
                'top': '0px',
                'opacity': '1'
            }, 300, 'easeOutQuint',
                                        function () {
                                            if (interactionControls) { $escontrols.append(interactionControls); }
                                            $escontrols.fadeIn(300);
                                        });
        }
        else {
            if (interactionControls) { $escontrols.append(interactionControls); }
            $escontainer.fadeIn(100);
        }
    }

    this.hideES = function (callback, callbackContext) {
        callbackContext = callbackContext || this;
        $escontainer.fadeOut(500, function () {
            $escontainer.empty();
            $escontrols.children().detach();
            if (callback)
                callback.call(callbackContext);
        });
    }

    this.close = function (callback, callbackContext) {
        callbackContext = callbackContext || this;
        $rootControl.animate(
          {
              'opacity': '0'
          }, 400, 'easeOutCirc', function () {
              if (callback)
                  callback.call(callbackContext);
          });
    }
};
