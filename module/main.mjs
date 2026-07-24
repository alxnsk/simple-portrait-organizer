import * as INIT from "./init.mjs";
Hooks.once('init', () => {
    const FP = INIT.CompatibleFilePickerGet();
    INIT.settings();
    const originalBrowse = FP.prototype.browse;
    
    FP.prototype.browse = async function () {
        const SimplePortraitOrganizer = await INIT.CompatibleUIGet();
        const app = new SimplePortraitOrganizer();
        if(game.user.isGM){
            app.originalBrowseGlobal = originalBrowse;
            app.lastClickThis        = this;
            app.lastClickArguments   = arguments;
        }
        
        const forced = game.settings.get("simple-portrait-organizer", "enabledForGm") || false;
        
        const hijackModes = {
            "imagevideo" : true,
            "image"      : true
        };
        
        if( (!forced && game.user.isGM) || true !== hijackModes[this.type] || undefined !== arguments[0]){
            return originalBrowse.call(this, ...arguments);
        }

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
    
    
});