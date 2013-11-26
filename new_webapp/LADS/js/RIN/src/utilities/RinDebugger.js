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
window.rin.internal = window.rin.internal || {};

// Global class to help with debugging RIN player at run time. Includes a number of helper classes during debugging. Not needed at shipping.
rin.internal.RinDebugger = function (rinPlayer) {
    var self = this;
    this.player = rinPlayer;
    this.orchestrator = rinPlayer.orchestrator;
    this.getCurrentESItems = function () {
        return rinPlayer.orchestrator.getCurrentESItems()
            .where(function (esItem) { return esItem.providerId != "unknownOrSystem" && !esItem.experienceStream.isSystemES; })
    };

    this.getBufferingESs = function () {
        return rinPlayer.orchestrator.getCurrentESItems()
        .where(function (esItem) { return esItem.experienceStream.getState() == rin.contracts.experienceStreamState.buffering; });
    };

    this.getPreloaderBufferingESs = function () {
        return rinPlayer.orchestrator.esItemsManager.preloaderES._currentPreloadList
        .where(function (esItem) { return esItem.experienceStream.getState() == rin.contracts.experienceStreamState.buffering || esItem.experienceStream.getState() == rin.contracts.experienceStreamState.closed; });
    };

    this.getAllESItems = function () {
        return rinPlayer.orchestrator.esItemsManager.screenPlayInterpreter.getESItems();
    };

    this.getErrorESItems = function () {
        return rinDebug.getAllESItems().where(function (esItem) { return esItem.experienceStream.getState() == rin.contracts.experienceStreamState.error; });
    };

    this.getRinData = function () { return rinPlayer.orchestrator._rinData; };

    this.getRinDataJsonString = function () { return JSON.stringify(rinPlayer.orchestrator._rinData); }

    this.getCurrentScreenPlayInfo = function () {
        var info =
            {
                currentScreenPlayId: rinPlayer.orchestrator.currentScreenPlayId,
                defaultScreenPlayId: rinPlayer.orchestrator._rinData.defaultScreenplayId,
                currentScreenPlay: rinPlayer.orchestrator._rinData.screenplays[rinPlayer.orchestrator.currentScreenPlayId]
            };
        return info;
    };

    // Log buffering ESs on buffering.
    setInterval(function () {
        if (rinPlayer.orchestrator && rinPlayer.orchestrator.getPlayerState() === rin.contracts.playerState.pausedForBuffering) {
            var log = "Buffering ESs: ";
            self.getPreloaderBufferingESs().foreach(function (es) { log += es.id + ", " });
            //self.getBufferingESs().foreach(function (es) { log += es.id + ", " });
            ///////////////////////// rin.internal.debug.write(log);
        }
    }, 1000);
}