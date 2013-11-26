/*!
* RIN Core JavaScript Library v1.0
* http://research.microsoft.com/rin
*
* Copyright 2012-2013, Microsoft Research
* <placeholder for RIN License>
*
* Date: <placeholder for SDK release date>
*/

window.rin = window.rin || {};
rin.contracts = rin.contracts || {};

// Enum that lists possible states RIN player can be in.
rin.contracts.playerState = {
    stopped: "stopped", // Initial state of the player. Player is stopped and not playing any content.
    pausedForBuffering: "pausedForBuffering", // Player is paused and is buffering content. Player will resume when enough content is buffered.
    pausedForExplore: "pausedForExplore", // Player is paused because user is interacting with the player. 
    playing: "playing", // Player is playing content.
    inTransition: "inTransition" // Player's state is in the middle of change. This state is set when player is changing from one state to another, for example, from stopped to playing.
};

// Enum that lists possible modes RIN player can be in.
rin.contracts.playerMode = {
    Demo: "demo", // Player is playing content from local narratives folder. Used during development and demoing from locally hosted content.
    Published: "published", // Player is hosted in some hosting solution like azure and is playing narrative & content pointed by web URLs.
    AuthorerPreview: "authorerPreview", // Player is playing inside an authoring tool's preview window. Authoring tool specific UI elements might be visible in this mode.
    AuthorerEditor: "authorerEditor" // Player is playing inside an authoring tool's path editor window. Path editing related UI controls & functionality may be visible in this mode.
};

// Enum that lists possible actions on narrative data load.
rin.contracts.playerStartupAction =
{
    play: "play", // Immediately play contents after loading
    pause: "pause", // Pause player at first frame after loading
    none: "none" // No action after load, continue to show blank screen
};

// Aspect ratio of narrative. This is specified in narrative data model.
rin.contracts.narrativeAspectRatio =
{
    none: "none",
    normal: "normal",
    wideScreen: "wideScreen"
};

// Class that specified event arguments of player state changed event.
rin.contracts.PlayerStateChangedEventArgs = function (previousState, currentState) {
    this.previousState = previousState;
    this.currentState = currentState;
};

rin.contracts.PlayerStateChangedEventArgs.prototype = {
    previousState: rin.contracts.playerState.stopped,
    currentState: rin.contracts.playerState.stopped
};

// Class that specified event arguments of player ES event.
rin.contracts.PlayerESEventArgs = function (sender, eventId, eventData) {
    this.sender = sender; this.eventId = eventId; this.eventData = eventData;
};