Hooks.once('init', () => {
    const originalBrowse = FilePicker.prototype.browse;
    FilePicker.prototype.browse = async function () {
        const forced = game.settings.get("simple-portrait-organizer", "enabledForGm") || false;

        const hijackModes = {
            "imagevideo" : true,
            "image"      : true
        };

        if( (!forced && game.user.isGM) || true !== hijackModes[this.type] ){
            return originalBrowse.call(this, ...arguments);
        }

        const app = new SimplePortraitOrganizer();
        app.render(true);
        const path = await app.result;
        // Update the target field
        if ( this.field ) {
            this.field.value = path;
            this.field.dispatchEvent(new Event("change", {bubbles: true, cancelable: true}));
        }
        // Trigger a callback and close
        if ( this.callback ) this.callback(path, this);
        return this.close();
        
    }
    
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
    
});

class SimplePortraitOrganizer extends FormApplication {
    constructor(...args) {
        super(...args);
        this._resolver = null;
        this._promise = new Promise(resolve => this._resolver = resolve);
        this.pasteEventHandler = this.#processPastedImage.bind(this);
        
        if( true === game.settings.get("simple-portrait-organizer", "capturePasteEvents") ){
            Hooks.on('closeSimplePortraitOrganizer', function(){
                window.removeEventListener("paste", this.pasteEventHandler);
            }.bind(this));
        }
    }
    
    get result() {
        return this._promise;
    }
    
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "simple-portrait-organizer",
            title: "Simple Portrait Organizer",
            template: "modules/simple-portrait-organizer/templates/ui.html"
        });
    }

    #processPastedImage(event){
        const pastedData = event?.clipboardData?.files[0];
        if ( undefined != pastedData && pastedData.type.substring(0,6) === "image/"){
            event.preventDefault();
            if( game.user.isGM && game.settings.get("simple-portrait-organizer", "keepOriginalFilenamesForGM") ){
                
                /**If the user is a GM and he wishes to keep the original file names, there's a good chance that when image is pasted from 
                 * the clipboard, especially if it was copied from a browser, it will have a generic name like "image".
                 * This can cause undesired behavior, so we will give the user a chance to review the file name and change it if needed. 
                 * If original names not required, we just replace "image" with random name.*/

                window.removeEventListener("paste", this.pasteEventHandler);

                new Dialog({
                    title: game.i18n.localize("simple-portrait-organizer.dialog.selectFilename"),
                    content: '<p/><div align="center"><input id="dialog_box" style="width:375px" autofocus value="' + pastedData.name.replace(/\.\w+$/, "") + '"></input></div>',
                    buttons: {
                        ok: {
                            label: "OK",
                            callback: function(){
                                this.#showPreview();
                                this._convertAndUpload(pastedData, document.getElementById("dialog_box").value + ".webp");
                            }.bind(this)
                        }
                    },
                    close: function(){this.close()}.bind(this),
                    default:"ok"
                }).render(true);
            }else{
                this.#showPreview();
                this._convertAndUpload(pastedData);
            }            
        }
    }

    #showPreview(){
        this.dropArea.classList.add("simple-portrait-organizer-hidden");
        this.inputUploadLabel.classList.add("simple-portrait-organizer-hidden");
        this.previewCanvas.classList.remove("simple-portrait-organizer-hidden");
    }
    
    activateListeners(html) {
        this.html = html;

        this.dropArea         = html.find("#simple-portrait-organizer-drop-area")[0];
        this.inputUpload      = html.find("#simple-portrait-organizer-upload")[0];
        this.inputUploadLabel = html.find("#simple-portrait-organizer-input-label")[0];
        this.previewCanvas    = html.find("#simple-portrait-organizer-preview-canvas")[0];

        if( true === game.settings.get("simple-portrait-organizer", "capturePasteEvents") ){
            window.addEventListener("paste", this.pasteEventHandler);
        };

        this.inputUpload.addEventListener("change", (e)=>{
            if (e.target.files[0]){
                this.#showPreview();
                this._convertAndUpload(e.target.files[0]);
            }
        });
        
        this.dropArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            this.dropArea.classList.add("hover");
        });
        
        this.dropArea.addEventListener("dragleave", () => {
            this.dropArea.classList.remove("hover");
        });
        
        this.dropArea.addEventListener("drop", (e) => {
            e.preventDefault();
            this.#showPreview();
            const file = e.dataTransfer.files[0];
            if (file) this._convertAndUpload(file);
        });
    }
    
    async _convertAndUpload(file, customName = null) {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.src = e.target.result;
            this.html.find("#simple-portrait-organizer-preview-canvas")[0].src = img.src;
            img.onload = async () => {
                const settingSizeLimit = game.settings.get("simple-portrait-organizer", "maxSidePixelSize") || 0;
                const settingCompression = game.settings.get("simple-portrait-organizer", "qualityPercent") || 80;
                
                let targetQuality = settingCompression / 100;
                if(settingCompression < 10 || settingCompression > 100){
                    targetQuality = 0.8;
                }
                
                let targetWidth  = img.width;
                let targetHeight = img.height;
                
                if( null != settingSizeLimit && settingSizeLimit > 0){
                    let scale = 1;
                    if(img.width > settingSizeLimit){
                        scale = settingSizeLimit / img.width;  
                    }else if(img.height > settingSizeLimit){
                        scale = settingSizeLimit / img.height;
                    }
                    
                    targetWidth  = Math.min( Math.trunc( targetWidth * scale ),  settingSizeLimit) ;
                    targetHeight = Math.min( Math.trunc( targetHeight * scale ), settingSizeLimit);
                }
                
                const canvas  = document.createElement("canvas");
                canvas.width  = targetWidth;
                canvas.height = targetHeight;
                canvas.getContext("2d").drawImage(img, 0, 0, img.width, img.height, 0,0, targetWidth, targetHeight);
                
                canvas.toBlob(async (blob) => {
                    const safeUserName = SimplePortraitOrganizer.escapeFileName(game.user.name);
                    
                    //Name is random or not? 
                    let newFileName = "";
                    if( game.user.isGM && game.settings.get("simple-portrait-organizer", "keepOriginalFilenamesForGM") ){
                        //GM may want to keep original filenames.
                        newFileName = customName ?? file.name.replace(/\.\w+$/, ".webp");
                    }else if( (true === game.settings.get("simple-portrait-organizer", "generateRandomFileName")) || /^image\.[a-zA-Z\d]{3,4}$/.test(file.name) ){
                        //It's random if GM desided it to be so, or image is pasted with generic name, like image.png, image.webp ... etc.
                        newFileName = safeUserName + "-" + foundry.utils.randomID(18) + ".webp";
                    }else{
                        //In other cases we just take original filename.
                        newFileName = safeUserName + "-" + ( customName ?? file.name.replace(/\.\w+$/, ".webp") );
                    }

                    const webpFile = new File([blob], newFileName, { type: "image/webp" });
                    let uploadPath = "";

                    if( game.user.isGM && "" !== game.settings.get("simple-portrait-organizer", "uploadDirectoryGM") )
                        uploadPath = game.settings.get("simple-portrait-organizer", "uploadDirectoryGM");
                    else
                        uploadPath = game.settings.get("simple-portrait-organizer", "uploadDirectory") || "";
                    
                    
                    const result = await FilePicker.upload("data", uploadPath, webpFile);
                    if (this._resolver) this._resolver(result.path); // Resolve the promise with the file path
                    this.close();
                    
                }, "image/webp", targetQuality);
            };
        };
        
        reader.readAsDataURL(file);
    }

    static escapeFileName(dirtyString){
        return dirtyString.replace(/[^A-Za-z\d]/g, "x");
    }
}