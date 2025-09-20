import { Popup } from "../game-objects/popup.js";
import { popupConfig } from "../config/popup-config.js";

class PopupManager {
    static instance = null;

    static initialize(scene) {
        if (this.instance && this.instance.scene !== scene) {
            // Distruggi il popup precedente se la scena cambia
            this.instance.destroy();
            this.instance = null;
        }

        if (!this.instance) {
            this.instance = new Popup(scene, scene.cameras.main.centerX, scene.cameras.main.centerY, "", popupConfig);
            scene.add.existing(this.instance);
        }
    }

    static show(text, duration = 2000, x = null, y = null, textColor = null, backgroundColor = null, style = null, fontSize = null, fontFamily = null, typewriter = false) {
        if (!this.instance) {
            console.error("PopupManager: Devi chiamare initialize(scene) prima di usare show.");
            return;
        }
        this.instance.show({ text, duration, x, y, textColor, backgroundColor, style, fontSize, fontFamily, typewriter });
    }

    static hide() {
        if (this.instance) {
            this.instance.hide();
        } else {
            console.error("PopupManager: Nessun popup da nascondere.");
        }
    }
}

export { PopupManager };