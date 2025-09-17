import { colors } from "../colors.js";

import { I18n } from "../i18n/i18n.js";

export default class BootScene extends Phaser.Scene {
    // Imposta a true per forzare almeno 1 secondo di caricamento
    static forceMinLoadTime = false;
    constructor() {
        super("BootScene");
    }


    preload() {
        // Background nero
        this.cameras.main.setBackgroundColor(colors.matisse);

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        this.loaderArc = this.add.graphics({ x: centerX, y: centerY });
        this.loaderArcRadius = 84;
        this.loaderArcColor = parseInt(colors.tacao.replace('#', '0x'));
        this.drawLoaderArc(0);

        this.load.on('progress', (value) => {
            this.drawLoaderArc(value);
        });
        this.load.on('complete', () => {
            this.drawLoaderArc(1);
        });

        // Carica WebFont Loader
        this.load.script("webfont", "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js");

        // Carica i cursori personalizzati
        this.load.image('cursor-default', 'assets/cursors/cursor-default.png');

        // Carica le immagini
        this.load.image('mainMenuBattleship', 'assets/img/battleShip-1.png');

        this.load.image('rightArrow', 'assets/img/rightArrow.png');

        this.load.image('startButtonInactive', 'assets/img/startButtonInactive.png');
        this.load.image('startButtonActive', 'assets/img/startButtonActive.png');

        this.load.image('volumeOnInactive', 'assets/img/volumeOnInactive.png');
        this.load.image('volumeOnActive', 'assets/img/volumeOnActive.png');
        this.load.image('volumeLowInactive', 'assets/img/volumeLowInactive.png');
        this.load.image('volumeLowActive', 'assets/img/volumeLowActive.png');
        this.load.image('volumeOffInactive', 'assets/img/volumeOffInactive.png');
        this.load.image('volumeOffActive', 'assets/img/volumeOffActive.png');

        this.load.image('fullScreenOffInactive', 'assets/img/fullScreenOffInactive.png');
        this.load.image('fullScreenOffActive', 'assets/img/fullScreenOffActive.png');
        this.load.image('fullScreenOnInactive', 'assets/img/fullScreenOnInactive.png');
        this.load.image('fullScreenOnActive', 'assets/img/fullScreenOnActive.png');

        this.load.image('battleship1x1', 'assets/img/battleship1x1.png');
        this.load.image('battleship2x1', 'assets/img/battleship2x1.png');
        this.load.image('battleship3x1', 'assets/img/battleship3x1.png');
        this.load.image('battleship4x1', 'assets/img/battleship4x1.png');

        this.load.image('githubInactive', 'assets/img/githubInactive.png');
        this.load.image('githubActive', 'assets/img/githubActive.png');

        this.load.image('changeLogSceneBackground', 'assets/img/changeLogSceneBackground.jpg');
        this.load.image('selectionSceneBackground', 'assets/img/selectionSceneBackground.jpg');

        // Carica i file audio
        this.load.audio('menuMusic', 'assets/audio/Overkill - After Dark 8 Bit Cover.mp3');
    }

    // Imposta il filtro NEAREST solo sulle texture delle battleship
    setBattleshipTexturesPixelPerfect() {
        const keys = ['battleship1x1', 'battleship2x1', 'battleship3x1', 'battleship4x1'];
        keys.forEach(key => {
            const tex = this.textures.get(key);
            if (tex) {
                tex.setFilter && tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
        });
    }

    create() {
        // Imposta filtro pixel perfect solo per le battleship
        this.setBattleshipTexturesPixelPerfect();
        // Carica i font tramite WebFont Loader e avvia la scena Start solo dopo che i font sono pronti
        if (window.WebFont) {
            this.loadFontsAndStart();
        } else {
            // WebFont Loader potrebbe non essere ancora pronto, aspetta che venga caricato
            this.time.delayedCall(100, () => this.create());
        }
    }

    loadFontsAndStart() {
        window.WebFont.load({
            custom: {
                families: ["PixelOperator8", "PixelOperator8-Bold"],
                urls: [
                    "assets/fonts/PixelOperator8.ttf",
                    "assets/fonts/PixelOperator8-Bold.ttf"
                ]
            },
            active: () => {
                this.setLanguageFromBrowser();
                this.scene.start("StartScene");
            },
            inactive: () => {
                // Anche se fallisce, prova comunque ad avviare la scena
                this.setLanguageFromBrowser();
                this.scene.start("StartScene");
            }
        });
    }

    setLanguageFromBrowser() {
        // Prova a rilevare la lingua del browser e impostala se supportata
        const supportedLangs = ["en", "it"];
        let browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || "en";
        browserLang = browserLang.split("-")[0].toLowerCase();
        if (supportedLangs.includes(browserLang)) {
            I18n.setLang(browserLang);
        }
    }

    // Disegna l'arco di caricamento in base al progresso (da 0 a 1)
    drawLoaderArc(progress) {
        this.loaderArc.clear();
        this.loaderArc.lineStyle(12, this.loaderArcColor, 1);
        const startAngle = Phaser.Math.DegToRad(-90);
        const endAngle = Phaser.Math.DegToRad(-90 + 360 * progress);
        this.loaderArc.beginPath();
        this.loaderArc.arc(0, 0, this.loaderArcRadius, startAngle, endAngle, false);
        this.loaderArc.strokePath();
    }
}
