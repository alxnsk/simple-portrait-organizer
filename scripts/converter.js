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

        const app = new WebPConverterApp();
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
    
    // Directory picker setting
    game.settings.register("simple-portrait-organizer", "uploadDirectory", {
        name: game.i18n.localize("simple-portrait-organizer.settings.uploadDirectoryName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.uploadDirectoryHint"),
        scope: "world",
        config: true,
        default: "",
        type: String,
        filePicker: "folder"
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
        type: new foundry.data.fields.NumberField({nullable: false, min: 10, max: 95, step: 5}),
        default: 80
    });
    
    game.settings.register("simple-portrait-organizer", "enabledForGm", {
        name: game.i18n.localize("simple-portrait-organizer.settings.enabledForGmName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.enabledForGmHint"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });

    game.settings.register("simple-portrait-organizer", "generateRandomFileName", {
        name: game.i18n.localize("simple-portrait-organizer.settings.generateRandomFileNameName"),
        hint: game.i18n.localize("simple-portrait-organizer.settings.generateRandomFileNameHint"),
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
    
});

class WebPConverterApp extends FormApplication {
    constructor(...args) {
        super(...args);
        this._resolver = null;
        this._promise = new Promise(resolve => this._resolver = resolve);
    }
    
    get result() {
        return this._promise;
    }
    
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "simple-portrait-organizer",
            title: "Simple image converter",
            template: "modules/simple-portrait-organizer/templates/ui.html"
        });
    }
    
    activateListeners(html) {
        html.find("#upload").on("change", this._handleUpload.bind(this));
        
        const dropArea      = html.find("#drop-area")[0];
        const previewCanvas = html.find("#preview-canvas")[0];
        const inputUpload   = html.find("#upload")[0];

        dropArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropArea.classList.add("hover");
        });
        
        dropArea.addEventListener("dragleave", () => {
            dropArea.classList.remove("hover");
        });
        
        dropArea.addEventListener("drop", (e) => {
            e.preventDefault();
            //dropArea.classList.remove("hover");
            dropArea.classList.add("hidden");
            inputUpload.classList.add("hidden");
            previewCanvas.classList.remove("hidden");
            
            const file = e.dataTransfer.files[0];
            if (file) this._convertAndUpload(file);
        });
    }
    
    async _handleUpload(event) {
        const file = event.target.files[0];
        if (file) this._convertAndUpload(file);
    }
    
    async _convertAndUpload(file) {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.src = e.target.result;
            document.getElementById("preview-canvas").src = img.src;
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
                    const safeUserName = WebPConverterApp.escapeUserName(game.user.name);
                    //Name is random or no?
                    const newFileName = true === game.settings.get("simple-portrait-organizer", "generateRandomFileName") ? 
                        safeUserName + "-" + foundry.utils.randomID(18) + ".webp" : safeUserName + "-" + file.name.replace(/\.\w+$/, ".webp");
                    
                    const webpFile = new File([blob], newFileName, { type: "image/webp" });
                    let uploadPath = game.settings.get("simple-portrait-organizer", "uploadDirectory") || "";

                    
                    const result = await FilePicker.upload("data", uploadPath, webpFile);
                    debugger;
                    if (this._resolver) this._resolver(result.path); // Resolve the promise with the file path
                    this.close();
                    
                }, "image/webp", targetQuality);
            };
        };
        
        reader.readAsDataURL(file);
    }

    static escapeUserName(dirtyString){
        return dirtyString.replace(/[^A-Za-z\d]/g, "x");
    }
}