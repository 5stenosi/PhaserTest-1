import { TextButton } from "../game-objects/text-button.js";
import { ImageButton } from "../game-objects/image-button.js";
import { I18n } from "../i18n/i18n.js";
import { translations } from "../i18n/translations.js";
import { changelogData } from "../changelog.js";
import { colors } from "../colors.js";

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super("MainMenuScene");
    }

    create() {
        // Stato volume: 1 = alto, 0.7 = medio, 0 = muto
        this.volumeLevel = 0.7; // valori: 1, 0.7, 0

        // Avvia la musica di menu se non già avviata, con volume coerente al livello intermedio
        if (!this.menuMusic) {
            // volume: 0.1 corrisponde al livello intermedio
            const initialVolume = this.volumeLevel === 1 ? 0.6 : this.volumeLevel === 0.7 ? 0.1 : 0;
            this.menuMusic = this.sound.add('menuMusic', { loop: true, volume: initialVolume });
            this.menuMusic.play();
        }

        // Sincronizza lingua attiva con I18n
        this.availableLangs = Object.keys(translations);
        this.currentLangIndex = this.availableLangs.indexOf(I18n.currentLang);
        if (this.currentLangIndex === -1) this.currentLangIndex = 0;
        // Titolo del gioco in uppercase
        const lines = [
            "Bones",
            "Do",
            "Rest",
            "Beneath",
        ];
        const lineHeight = 100;
        this.titleTexts = lines.map((line, i) => {
            const t = this.add.text(this.cameras.main.centerX, 50 + i * lineHeight, line.toUpperCase(), {
                fontFamily: "PixelOperator8-Bold",
                fontSize: "72px",
                color: colors.tacao,
            }).setOrigin(0.5, 0);
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



        // --- Gruppo per bottoni github e versioning ---
        // Crea un container Phaser per raggruppare i due bottoni
        this.topRightButtonsGroup = this.add.container();

        // Bottone Github
        this.githubButton = new ImageButton(
            this,
            0, // X relativo al container
            0, // Y relativo al container
            'githubInactive',
            'githubActive'
        ).setOrigin(1, 0);
        this.topRightButtonsGroup.add(this.githubButton);

        // Bottone Versione (dinamico dalla changelog)
        let latestVersion = "v0.0.0";
        if (Array.isArray(changelogData) && changelogData.length > 0) {
            // Trova la entry con la data più recente (formato DD-MM-YYYY)
            const sorted = [...changelogData].sort((a, b) => {
                const [da, ma, ya] = a.date.split("-").map(Number);
                const [db, mb, yb] = b.date.split("-").map(Number);
                // YYYYMMDD per confronto
                const numA = ya * 10000 + ma * 100 + da;
                const numB = yb * 10000 + mb * 100 + db;
                return numB - numA;
            });
            latestVersion = sorted[0].version;
        }
        this.versionText = new TextButton(this, 0, 0, latestVersion, {
            fontFamily: "PixelOperator8",
            fontSize: "16px",
            color: colors.tacao,
            activeColor: colors.matisse,
            backgroundColor: "rgba(0,0,0,0)",
            activeBackground: colors.tacao
        }).setOrigin(1, 0);
        // Posiziona il bottone versione a sinistra del bottone github
        this.versionText.x = -this.githubButton.width; // 10px di spazio tra i bottoni
        this.topRightButtonsGroup.add(this.versionText);

        // Posiziona il gruppo nell'angolo in alto a destra
        this.topRightButtonsGroup.x = 865; // Coordinata X assoluta
        this.topRightButtonsGroup.y = 25;  // Coordinata Y assoluta

        // Listener per il bottone github
        this.githubButton.on('buttonclick', () => {
            window.open('https://github.com/5stenosi/PhaserTest-1', '_blank');
        });

        // Listener per il bottone versione
        this.versionText.on('buttonclick', () => {
            this.scene.start('ChangeLogScene');
        });

        // bottone lingua
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

        this.startGameButton.on('buttonclick', () => {
            this.scene.start('SelectionScene');
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