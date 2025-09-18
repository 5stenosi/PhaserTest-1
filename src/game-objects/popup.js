import { colors } from "../colors.js";
import { popupConfig } from "../config/popup-config.js";

export class Popup extends Phaser.GameObjects.Container {
    constructor(scene, x, y, text, options = {}) {
        super(scene, x, y);
        this.scene = scene;
        this.text = text;
        this.options = Object.assign({}, popupConfig, options); // Usa la configurazione centralizzata

        // Sfondo rettangolare
        this.bg = scene.add.rectangle(0, 0, 10, 10, 0x000000, 1);
        this.bg.setOrigin(0.5);
        this.add(this.bg);

        // Testo
        this.textObj = scene.add.text(0, 0, text, {
            fontFamily: this.options.fontFamily,
            fontSize: this.options.fontSize,
            color: this.options.color,
            backgroundColor: this.options.backgroundColor,
            padding: this.options.padding,
            resolution: this.options.resolution // Applica la risoluzione al testo
        }).setOrigin(0.5);
        this.add(this.textObj);


        // Aggiungi alla scena
        scene.add.existing(this);
        this.setDepth(1000);
        this.setVisible(false);
        this.timer = null;

    }

    /** Mostra il popup per la durata specificata, con opzioni aggiuntive */
    show({
        text = null,
        duration = null,
        x = null,
        y = null,
        textColor = null,
        backgroundColor = null
    } = {}) {
        if (text !== null) {
            this.textObj.setText(text);
        }
        if (x !== null && y !== null) {
            this.setPositionXY(x, y);
        }
        if (textColor !== null) {
            this.textObj.setColor(textColor);
        }
        if (backgroundColor !== null) {
            this.bg.fillColor = Phaser.Display.Color.HexStringToColor(backgroundColor).color;
        }
        this.setVisible(true);
        if (this.timer) {
            this.timer.remove(false);
        }
        const dur = duration !== null ? duration : this.options.duration;
        this.timer = this.scene.time.delayedCall(dur, () => {
            this.setVisible(false);
            this.timer = null;
        });
    }

    /** Nasconde subito il popup */
    hide() {
        this.setVisible(false);
        if (this.timer) {
            this.timer.remove(false);
            this.timer = null;
        }
    }

    /** Cambia posizione */
    setPositionXY(x, y) {
        this.x = x;
        this.y = y;
    }
}
