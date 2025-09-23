import { colors } from "../colors.js";
import { popupConfig } from "../config/popup-config.js";

export class Popup extends Phaser.GameObjects.Container {
    constructor(scene, x, y, text, options = {}) {
        super(scene, x, y);
        this.scene = scene;
        this.text = text;
        this.options = Object.assign({}, popupConfig, options); // Usa la configurazione centralizzata

        // Sfondo rettangolare esterno (per double border)
        this.outerBg = scene.add.rectangle(0, 0, 10, 10, Phaser.Display.Color.HexStringToColor(colors.matisse).color, 1);
        this.outerBg.setOrigin(0.5);
        this.add(this.outerBg);
        this.outerBg.setVisible(false);

        // Sfondo rettangolare interno (per double border)
        this.innerBg = scene.add.rectangle(0, 0, 10, 10, Phaser.Display.Color.HexStringToColor(colors.madang).color, 1);
        this.innerBg.setOrigin(0.5);
        this.add(this.innerBg);
        this.innerBg.setVisible(false);

        // Sfondo rettangolare principale
        this.bg = scene.add.rectangle(0, 0, 10, 10, Phaser.Display.Color.HexStringToColor(this.options.backgroundColor).color, 1);
        this.bg.setOrigin(0.5);
        this.add(this.bg);

        // Testo
        this.textObj = scene.add.text(0, 0, text, {
            fontFamily: this.options.fontFamily,
            fontSize: this.options.fontSize,
            color: this.options.color,
            padding: this.options.padding,
            resolution: this.options.resolution, // Applica la risoluzione al testo
            wordWrap: { width: this.scene.cameras.main.width - 90 },
            lineSpacing: this.options.lineSpacing,
            align: 'center'
        }).setOrigin(0.5);
        this.add(this.textObj);


        // Aggiungi alla scena
        scene.add.existing(this);
        this.setDepth(1000);
        this.setVisible(false);
        this.timer = null;
        this.style = 'single'; // default

    }

    /** Mostra il popup per la durata specificata, con opzioni aggiuntive */
    show({
        text = null,
        duration = null,
        x = null,
        y = null,
        textColor = null,
        backgroundColor = null,
        style = null,
        fontSize = null,
        fontFamily = null,
        typewriter = false,
        onComplete = null
    } = {}) {
        if (text !== null) {
            this.fullText = text;
            if (!typewriter) {
                this.textObj.setText(text);
                this.textObj.setLineSpacing(this.options.lineSpacing);
            } else {
                this.textObj.setText('');
                this.currentCharIndex = 0;
            }
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
        if (style !== null) {
            this.style = style;
        }
        if (fontSize !== null) {
            this.textObj.setFontSize(fontSize);
        }
        if (fontFamily !== null) {
            this.textObj.setFontFamily(fontFamily);
        }

        // Aggiorna colori e visibilità basata sullo stile
        if (this.style === 'double') {
            this.outerBg.setVisible(true);
            this.innerBg.setVisible(true);
            this.bg.fillColor = Phaser.Display.Color.HexStringToColor(colors.matisse).color;
            this.textObj.setColor(colors.madang);
        } else {
            this.outerBg.setVisible(false);
            this.innerBg.setVisible(false);
            this.bg.fillColor = Phaser.Display.Color.HexStringToColor(this.options.backgroundColor).color;
            this.textObj.setColor(this.options.color);
        }

        // Ridimensiona sfondi basati sul testo
        const bounds = this.textObj.getBounds();
        const padding = this.options.padding;
        const width = bounds.width + padding.left + padding.right;
        const height = bounds.height + padding.top + padding.bottom;

        if (this.style === 'double') {
            this.outerBg.setSize(width + 8, height + 8);
            this.innerBg.setSize(width + 4, height + 4);
            this.bg.setSize(width, height);
        } else {
            this.bg.setSize(width, height);
        }

        this.setVisible(true);
        if (this.timer) {
            this.timer.remove(false);
        }

        this.onComplete = onComplete;

        if (typewriter && text !== null) {
            this.startTypewriterEffect();
        } else {
            const dur = duration !== null ? duration : this.options.duration;
            this.timer = this.scene.time.delayedCall(dur, () => {
                this.setVisible(false);
                this.timer = null;
                if (this.onComplete) this.onComplete();
            });
        }
    }

    startTypewriterEffect() {
        this.currentCharIndex = 0;
        this.lastTypewriterSound = null;
        this.typewriterTimer = this.scene.time.addEvent({
            delay: 150, // Delay between characters in ms
            callback: this.typeNextChar,
            callbackScope: this,
            loop: true
        });
    }

    typeNextChar() {
        if (this.currentCharIndex < this.fullText.length) {
            let charsToAdd = 1;
            let playSound = true;

            // Se il carattere corrente è uno spazio, aggiungi spazio + prossimo carattere insieme
            if (this.fullText[this.currentCharIndex] === ' ' && this.currentCharIndex + 1 < this.fullText.length) {
                charsToAdd = 2;
                playSound = true; // Suona per il prossimo carattere (la lettera dopo lo spazio)
            } else if (this.fullText[this.currentCharIndex] === ' ') {
                playSound = false; // Spazio isolato, non suonare
            }

            this.currentCharIndex += charsToAdd;
            this.textObj.setText(this.fullText.substring(0, this.currentCharIndex));

            // Ridimensiona sfondi basati sul testo corrente
            const bounds = this.textObj.getBounds();
            const padding = this.options.padding;
            const width = bounds.width + padding.left + padding.right;
            const height = bounds.height + padding.top + padding.bottom;

            if (this.style === 'double') {
                this.outerBg.setSize(width + 8, height + 8);
                this.innerBg.setSize(width + 4, height + 4);
                this.bg.setSize(width, height);
            } else {
                this.bg.setSize(width, height);
            }

            if (playSound) {
                // Play random typewriter sound, but not the same as last time
                const sounds = ['mediumTypewriterSound'];
                let availableSounds = sounds.filter(sound => sound !== this.lastTypewriterSound);
                if (availableSounds.length === 0) {
                    availableSounds = sounds; // Fallback if somehow no sounds available
                }
                const randomSound = availableSounds[Math.floor(Math.random() * availableSounds.length)];
                this.scene.sound.play(randomSound, { volume: 0.1 });
                this.lastTypewriterSound = randomSound;
            }
        } else {
            // Finished typing, start hide timer
            this.typewriterTimer.remove(false);
            this.typewriterTimer = null;
            this.timer = this.scene.time.delayedCall(3000, () => { // Default duration for typewriter popups
                if (this.onComplete) this.onComplete();
                this.scene.time.delayedCall(100, () => {
                    this.setVisible(false);
                    this.timer = null;
                });
            });
        }
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
