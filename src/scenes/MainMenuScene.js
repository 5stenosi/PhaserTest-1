import { TextButton } from "../game-objects/text-button.js";
import { ImageButton } from "../game-objects/image-button.js";
import { I18n } from "../i18n/i18n.js";
import { translations } from "../i18n/translations.js";
import { colors } from "../colors.js";

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super("MainMenuScene");
    }

    create() {
        // Avvia la musica di menu se non già avviata
        if (!this.menuMusic) {
            this.menuMusic = this.sound.add('menuMusic', { loop: true, volume: 1 });
            this.menuMusic.play();
        }
        // Titolo del gioco in uppercase
        const lines = [
            "The Sea",
            "Has",
            "No",
            "Claim"
        ];
        const lineHeight = 100;
        this.titleTexts = lines.map((line, i) => {
            const t = this.add.text(this.cameras.main.centerX, 50 + i * lineHeight, line.toUpperCase(), {
                fontFamily: "PixelOperator8-Bold",
                fontSize: "72px",
                color: colors.tacao,
            }).setOrigin(0.5, 0);
            // Ombra verso il basso a destra
            t.setShadow(-8, 3, colors.matisse, 0);
            return t;
        });


        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'mainMenuBattleship').setOrigin(0.5, 0.5).setScale(-1, 1).setDepth(-1);


        // Effetto lampeggio
        const showDuration = 1150;
        const hideDuration = 150;
        const showTexts = () => {
            this.titleTexts.forEach(text => text.visible = true);
            this.time.delayedCall(showDuration, hideTexts);
        };
        const hideTexts = () => {
            this.titleTexts.forEach(text => text.visible = false);
            this.time.delayedCall(hideDuration, showTexts);
        };
        showTexts();


        // credits con maggiore stacco tra le righe
        this.creditsText = this.add.text(this.cameras.main.centerX, 575, I18n.t('credits'), {
            fontFamily: "PixelOperator8",
            fontSize: "16px",
            color: colors.tacao,
            align: "center",
            lineSpacing: 10
        }).setOrigin(0.5, 1);


        // Stato volume: 1 = alto, 0.5 = medio, 0 = muto
        this.volumeLevel = 1; // valori: 1, 0.7, 0
        this.updateVolumeButtonTextures = () => {
            if (this.volumeLevel === 1) {
                this.volumeButton.textureInactive = 'volumeOnInactive';
                this.volumeButton.textureActive = 'volumeOnActive';
            } else if (this.volumeLevel === 0.7) {
                this.volumeButton.textureInactive = 'volumeLowInactive';
                this.volumeButton.textureActive = 'volumeLowActive';
            } else {
                this.volumeButton.textureInactive = 'volumeOffInactive';
                this.volumeButton.textureActive = 'volumeOffActive';
            }
            this.volumeButton.setTexture(this.volumeButton.textureInactive);
        };

        this.volumeButton = new ImageButton(
            this,
            35,
            25,
            'volumeOnInactive',
            'volumeOnActive'
        ).setOrigin(0, 0);
        this.add.existing(this.volumeButton);
        this.updateVolumeButtonTextures();

        // Toggle volume on click
        this.volumeButton.on('buttonclick', () => {
            // Ciclo: 1 → 0.7 → 0 → 1
            if (this.volumeLevel === 1) {
                this.volumeLevel = 0.7;
            } else if (this.volumeLevel === 0.7) {
                this.volumeLevel = 0;
            } else {
                this.volumeLevel = 1;
            }
            this.updateVolumeButtonTextures();

            if (this.menuMusic) {
                const transitionDuration = 100; // ms, più veloce
                if (this.volumeLevel === 1) {
                    if (this.menuMusic.isPaused) {
                        this.menuMusic.resume();
                    } else if (!this.menuMusic.isPlaying) {
                        this.menuMusic.play();
                    }
                    this.tweens.addCounter({
                        from: this.menuMusic.volume,
                        to: 0.6,
                        duration: transitionDuration,
                        onUpdate: tween => {
                            this.menuMusic.setVolume(tween.getValue());
                        }
                    });
                } else if (this.volumeLevel === 0.7) {
                    if (this.menuMusic.isPaused) {
                        this.menuMusic.resume();
                    } else if (!this.menuMusic.isPlaying) {
                        this.menuMusic.play();
                    }
                    this.tweens.addCounter({
                        from: this.menuMusic.volume,
                        to: 0.1,
                        duration: transitionDuration,
                        onUpdate: tween => {
                            this.menuMusic.setVolume(tween.getValue());
                        }
                    });
                } else {
                    // Fade out e pausa
                    this.tweens.addCounter({
                        from: this.menuMusic.volume,
                        to: 0,
                        duration: transitionDuration,
                        onUpdate: tween => {
                            this.menuMusic.setVolume(tween.getValue());
                        },
                        onComplete: () => {
                            this.menuMusic.pause();
                        }
                    });
                }
            }
        });


        // bottone lingua
        this.availableLangs = Object.keys(translations);
        this.currentLangIndex = 0;
        this.langButton = new TextButton(this, 35, 575, this.availableLangs[this.currentLangIndex], {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "28px",
            color: colors.tacao,
            activeColor: colors.matisse,
            backgroundColor: "rgba(0,0,0,0)",
            activeBackground: colors.tacao
        }, () => this.changeLanguage()).setOrigin(0, 1);
        this.add.existing(this.langButton);

        // collega il click del bottone lingua
        this.langButton.on('buttonclick', () => {
            this.changeLanguage();
        });


        // bottone inizio gioco
        this.startGameButton = new TextButton(this, 865, 575, I18n.t('start').toUpperCase(), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "28px",
            color: colors.tacao,
            activeColor: colors.matisse,
            backgroundColor: "rgba(0,0,0,0)",
            activeBackground: colors.tacao
        }).setOrigin(1, 1);
        this.add.existing(this.startGameButton);
        // esempio: azione sul click del bottone start (da personalizzare)
        this.startGameButton.on('buttonclick', () => {
            // Avvia la scena di gioco o altra azione
            // this.scene.start('GameScene');
        });
    }


    changeLanguage() {
        // ciclo la lingua
        this.currentLangIndex = (this.currentLangIndex + 1) % this.availableLangs.length;
        const newLang = this.availableLangs[this.currentLangIndex];
        I18n.setLang(newLang);

        // aggiorna tutti i testi
        this.langButton.setText(newLang);
        this.startGameButton.setText(I18n.t('start').toUpperCase());
        this.creditsText.setText(I18n.t('credits'));
    }



}