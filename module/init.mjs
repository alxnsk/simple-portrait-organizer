export function settings(){
    //Some cloud providers are implemented their own file storage systems,
    //  and any hoster can use S3 storage.

    const picker = new FilePicker();
    const sourceList = {};
    for(const option in picker.sources){
        //Public will be always excluded from sources. The user's files, should not be there.
        if("public" !== option)
            sourceList[option] = option;
    }

    game.settings.register("simple-portrait-organizer", "storageSource", {
        name: game.i18n.localize("simple-portrait-organizer.settings.storageSourceName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.storageSourceHint"),
        scope: "world",
        config: true,
        type: String,
        default: "data",
        choices: sourceList
    });
    
    
    // Upload dir path
    game.settings.register("simple-portrait-organizer", "uploadDirectory", {
        name: game.i18n.localize("simple-portrait-organizer.settings.uploadDirectoryName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.uploadDirectoryHint"),
        scope: "world",
        config: true,
        default: "",
        type: String,
        filePicker: "folder"
    });
    
    game.settings.register("simple-portrait-organizer", "capturePasteEvents", {
        name: game.i18n.localize("simple-portrait-organizer.settings.capturePasteEventsName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.capturePasteEventsHint"),
        scope: "world",
        config: true,
        default: true,
        requiresReload: true,
        type: Boolean
    });
    
    // Max side size in pixels.
    game.settings.register("simple-portrait-organizer", "maxSidePixelSize", {
        name: game.i18n.localize("simple-portrait-organizer.settings.maxSidePixelSizeName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.maxSidePixelSizeHint"),
        scope: "world",
        config: true,
        default: 0,
        type: Number
    });
    
    // Compression rate percent
    game.settings.register("simple-portrait-organizer", "qualityPercent", {
        name: game.i18n.localize("simple-portrait-organizer.settings.qualityPercentName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.qualityPercentHint"),
        scope: "world",
        config: true,
        type: Number,
        range: { min: 5, max: 95, step: 5 },
        default: 80
    });
    
    game.settings.register("simple-portrait-organizer", "generateRandomFileName", {
        name: game.i18n.localize("simple-portrait-organizer.settings.generateRandomFileNameName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.generateRandomFileNameHint"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    
    game.settings.register("simple-portrait-organizer", "enabledForGm", {
        name: game.i18n.localize("simple-portrait-organizer.settings.enabledForGmName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.enabledForGmHint"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    
    // Special upload dir for GM. If needed.
    game.settings.register("simple-portrait-organizer", "uploadDirectoryGM", {
        name: game.i18n.localize("simple-portrait-organizer.settings.uploadDirectoryGMName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.uploadDirectoryGMHint"),
        scope: "world",
        config: true,
        default: "",
        type: String,
        filePicker: "folder"
    });
    
    game.settings.register("simple-portrait-organizer", "keepOriginalFilenamesForGM", {
        name: game.i18n.localize("simple-portrait-organizer.settings.keepOriginalFilenamesForGMName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.keepOriginalFilenamesForGMHint"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
}