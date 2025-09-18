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
                fontSize: "80px",
                resolution: 3,
                color: colors.tacao,
            }).setOrigin(0.5, 0);
            t.setShadow(-16, 8, colors.matisse, 0);
            return t;
        });


        this.textures.get('mainMenuBattleship').setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.add.image(450, 300, 'mainMenuBattleship')
            .setOrigin(0.5, 0.5)
            .setScale(-1, 1)
            .setDepth(-1);


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


        this.instagramButton = new TextButton(this, this.cameras.main.centerX, 585, "@stenosi", {
            fontFamily: "PixelOperator8",
            fontSize: "16px",
            color: colors.tacao,
            activeColor: colors.matisse,
            backgroundColor: "rgba(0,0,0,0)",
            activeBackground: colors.tacao,
        }).setOrigin(0.5, 1);
        this.add.existing(this.instagramButton);

        this.instagramButton.on('buttonclick', () => {
            window.open('https://www.instagram.com/stenosi/', '_blank');
        });

        // credits con maggiore stacco tra le righe
        this.creditsText = this.add.text(this.cameras.main.centerX, 585 - this.instagramButton.height, I18n.t('credits'), {
            fontFamily: "PixelOperator8",
            fontSize: "16px",
            resolution: 3,
            color: colors.tacao,
            align: "center",
        }).setOrigin(0.5, 1);


        // --- Gruppo volume + fullscreen in alto a sinistra ---
        this.topLeftButtonsGroup = this.add.container();


        // Bottone fullscreen (ora a sinistra)
        this.fullScreenButton = new ImageButton(
            this,
            0,
            0,
            'fullScreenOffInactive',
            'fullScreenOffActive'
        ).setOrigin(0, 0);
        this.topLeftButtonsGroup.add(this.fullScreenButton);

        // Bottone volume (ora a destra del fullscreen)
        this.volumeButton = new ImageButton(
            this,
            this.fullScreenButton.width,
            0,
            'volumeOnInactive',
            'volumeOnActive'
        ).setOrigin(0, 0);
        this.topLeftButtonsGroup.add(this.volumeButton);

        // Posiziona il gruppo in alto a sinistra
        this.topLeftButtonsGroup.x = 35;
        this.topLeftButtonsGroup.y = 25;

        // Funzione per aggiornare la texture del bottone volume
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
        this.updateVolumeButtonTextures();

        // Toggle volume on click
        this.volumeButton.on('buttonclick', () => {
            this.sound.play('clickSound');

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

        // Listener per il bottone fullscreen
        this.fullScreenButton.on('buttonclick', () => {
            this.sound.play('clickSound');

            if (this.scale.isFullscreen) {
                this.scale.stopFullscreen();
                // Torna alle icone "entrambe OFF"
                this.fullScreenButton.textureInactive = 'fullScreenOffInactive';
                this.fullScreenButton.textureActive = 'fullScreenOffActive';
                this.fullScreenButton.setTexture('fullScreenOffInactive');
            } else {
                this.scale.startFullscreen();
                // Cambia alle icone "entrambe ON"
                this.fullScreenButton.textureInactive = 'fullScreenOnInactive';
                this.fullScreenButton.textureActive = 'fullScreenOnActive';
                this.fullScreenButton.setTexture('fullScreenOnInactive');
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
            // Trova la entry più recente: se la data è uguale, conta la versione più "grande"
            const compareVersions = (v1, v2) => {
                // Rimuove la 'v' iniziale e confronta come array di numeri
                const a = v1.replace(/^v/, '').split('.').map(Number);
                const b = v2.replace(/^v/, '').split('.').map(Number);
                for (let i = 0; i < Math.max(a.length, b.length); i++) {
                    const na = a[i] || 0;
                    const nb = b[i] || 0;
                    if (na > nb) return 1;
                    if (na < nb) return -1;
                }
                return 0;
            };
            const sorted = [...changelogData].sort((a, b) => {
                const [da, ma, ya] = a.date.split("-").map(Number);
                const [db, mb, yb] = b.date.split("-").map(Number);
                // YYYYMMDD per confronto
                const numA = ya * 10000 + ma * 100 + da;
                const numB = yb * 10000 + mb * 100 + db;
                if (numB !== numA) {
                    return numB - numA;
                } else {
                    // Se la data è uguale, confronta la versione
                    return compareVersions(b.version, a.version);
                }
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
            this.sound.play('clickSound');
            this.scene.start('ChangeLogScene');
        });

        // bottone lingua
        this.langButton = new TextButton(this, 35, 575, this.availableLangs[this.currentLangIndex], {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "32px",
            color: colors.tacao,
            activeColor: colors.matisse,
            backgroundColor: "rgba(0,0,0,0)",
            activeBackground: colors.tacao
        }, () => this.changeLanguage()).setOrigin(0, 1);
        this.add.existing(this.langButton);

        // collega il click del bottone lingua
        this.langButton.on('buttonclick', () => {
            this.sound.play('clickSound');
            this.changeLanguage();
        });


        // bottone inizio gioco
        this.startGameButton = new TextButton(this, 865, 575, I18n.t('start').toUpperCase(), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "32px",
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