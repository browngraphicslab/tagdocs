/// <reference path="../core/Common.js" />

// Behavior to seek the narrative to a specified time.
rin.interactionBehaviorService.registerInteractionBehavior("rin.interactionBehaviors.seekToHT", {
    execute: function (args, onCompleteCallback) {

        var playerState = args.orchestrator.getPlayerState();
        var url;
        if (args && args.sourceItem && args.sourceItem.url) {
            url = args.sourceItem.url;
        }
        else {
            if (args.sourceItem.seekTime !== undefined) {
                var shouldPlay = rin.contracts.playerState.playing || playerState == rin.contracts.playerState.inTransition;
                url = "http://default/?begin={0}&action={1}".rinFormat(args.sourceItem.seekTime, shouldPlay ? "play" : "pause");

            }
        }
        args.orchestrator.seekUrl(url);

        onCompleteCallback();
    }
});

// Behavior to seek the load a narrative in a popup
rin.interactionBehaviorService.registerInteractionBehavior("rin.interactionBehaviors.popup", {
    execute: function (args, onCompleteCallback) {

        var factoryFunction = rin.ext.getFactory(rin.contracts.systemFactoryTypes.behaviorFactory, "MicrosoftResearch.Rin.Behaviors.Popup");
        var popup = new factoryFunction(args.orchestrator);
        args.sourceItem.DataContext = args.sourceItem.data;
        popup.executeBehavior(args.sourceItem, onCompleteCallback);
    }
});

// Behavior to seek the narrative to a specified screenplay and offset.
rin.interactionBehaviorService.registerInteractionBehavior("rin.interactionBehaviors.seekToScreenplayOffset", {
    execute: function (args, onCompleteCallback) {

        var playerState = args.orchestrator.getPlayerState();
        if (playerState == rin.contracts.playerState.playing || playerState == rin.contracts.playerState.inTransition) {
            args.orchestrator.play(args.sourceItem.seekTime, args.sourceItem.screenplay);
        }
        else {
            args.orchestrator.pause(args.sourceItem.seekTime, args.sourceItem.screenplay);
        }

        onCompleteCallback();
    }
});

// Behavior to apply a well defined keyframe on the current ES
rin.interactionBehaviorService.registerInteractionBehavior("rin.interactionBehaviors.applyKeyframe", {
    execute: function (args, onCompleteCallback) {

        if (args.sourceES.displayKeyframe) {
            var kf = {
                "header": {
                    "offset": 0,
                    "holdDuration": 0.5
                },
                "data": {
                    "default": "<ZoomableMediaKeyframe Media_Type='SingleDeepZoomImage' Media_Source='R-1' Viewport_X='0.5923811970600481' Viewport_Y='0.29659771339558905' Viewport_Width='0.00025961484292674151' Viewport_Height='0.00014609263999044406' Highlight_Visible='false' Highlight_X='0' Highlight_Y='0' Highlight_Width='0' Highlight_Height='0' Highlight_Render_Style='NoHighlight' Highlight_Render_Attribs='' Media_AspRatio='0.53243931310913006'/>",
                    "TransitionTime": "<TransitionTime>0</TransitionTime>",
                    "PauseDuration": "<PauseDuration>0.5</PauseDuration>",
                    "keyframeThumbnail": "<Thumbnail>11a6ab9c-7cce-4c45-b4c4-bb45b6c44cdd_keyframe_cdd2ecd5-6e5f-45a7-b549-46d6bc835636.bmp</Thumbnail>"
                }
            };
            args.sourceES.displayKeyframe(kf);
        }

        onCompleteCallback();
    }
});