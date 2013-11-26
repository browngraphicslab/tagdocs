/*!
* RIN Experience Provider JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

/// <reference path="../contracts/IExperienceStream.js" />

rin.ext.registerFactory(rin.contracts.systemFactoryTypes.interactionControlFactory, rin.contracts.interactionControlNames.panZoomControl,
    function (resourcesResolver, loadedCallback) {
        $.get(resourcesResolver.resolveSystemResource("interactionControls/PanZoomControls.html"), null, function (visual) {
            var wrap = document.createElement("div"),
                systemRoot = resourcesResolver.getSystemRootUrl();
            wrap.style["display"] = "inline-block";
            rin.util.assignAsInnerHTMLUnsafe(wrap, visual.replace(/SYSTEM_ROOT/g, systemRoot));
            loadedCallback(wrap);
        });
    });

rin.ext.registerFactory(rin.contracts.systemFactoryTypes.interactionControlFactory, rin.contracts.interactionControlNames.mediaControl,
    function (resourcesResolver, loadedCallback) {
        $.get(resourcesResolver.resolveSystemResource("interactionControls/MediaControls.html"), null, function (visual) {
            var wrap = document.createElement("div"),
                systemRoot = resourcesResolver.getSystemRootUrl();
            rin.util.assignAsInnerHTMLUnsafe(wrap, visual.replace(/SYSTEM_ROOT/g, systemRoot))
            loadedCallback(wrap);
        });
    });

rin.ext.registerFactory(rin.contracts.systemFactoryTypes.interactionControlFactory, "MicrosoftResearch.Rin.InteractionControls.RotateControl",
   function (resourcesResolver, loadedCallback) {
       $.get(resourcesResolver.resolveSystemResource("interactionControls/RotateControl.html"), null, function (visual) {
           var wrap = document.createElement("div"),
               systemRoot = resourcesResolver.getSystemRootUrl();
           wrap.style["display"] = "inline-block";
           rin.util.assignAsInnerHTMLUnsafe(wrap, visual.replace(/SYSTEM_ROOT/g, systemRoot))
           loadedCallback(wrap);
       });
   });
