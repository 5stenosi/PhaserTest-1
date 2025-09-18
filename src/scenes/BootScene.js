import { colors } from "../colors.js";
import { I18n } from "../i18n/i18n.js";

export default class BootScene extends Phaser.Scene {
    constructor() {
        super("BootScene");
    }


    preload() {
        // Background
        this.cameras.main.setBackgroundColor(colors.matisse);

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        this.loaderArc = this.add.graphics({ x: centerX, y: centerY });
        this.loaderArcRadius = 84;
        this.loaderArcColor = parseInt(colors.tacao.replace('#', '0x'));
        this.drawLoaderArc(0);

        this.load.on('progress', value => this.drawLoaderArc(value));
        this.load.on('complete', () => this.drawLoaderArc(1));

        // Risorse da caricare
        const images = [
            ['cursor-default', 'assets/cursors/cursor-default.png'],
            ['mainMenuBattleship', 'assets/img/battleShip-1.png'],
            ['rightArrowInactive', 'assets/img/rightArrowInactive.png'],
            ['rightArrowActive', 'assets/img/rightArrowActive.png'],
            ['startButtonInactive', 'assets/img/startButtonInactive.png'],
            ['startButtonActive', 'assets/img/startButtonActive.png'],
            ['volumeOnInactive', 'assets/img/volumeOnInactive.png'],
            ['volumeOnActive', 'assets/img/volumeOnActive.png'],
            ['volumeLowInactive', 'assets/img/volumeLowInactive.png'],
            ['volumeLowActive', 'assets/img/volumeLowActive.png'],
            ['volumeOffInactive', 'assets/img/volumeOffInactive.png'],
            ['volumeOffActive', 'assets/img/volumeOffActive.png'],
            ['fullScreenOffInactive', 'assets/img/fullScreenOffInactive.png'],
            ['fullScreenOffActive', 'assets/img/fullScreenOffActive.png'],
            ['fullScreenOnInactive', 'assets/img/fullScreenOnInactive.png'],
            ['fullScreenOnActive', 'assets/img/fullScreenOnActive.png'],
            ['battleship1x1-Inactive', 'assets/img/raft.png'],
            ['battleship2x1-Inactive', 'assets/img/inflatable.png'],
            ['battleship3x1-Inactive', 'assets/img/gondola.png'],
            ['battleship4x1-Inactive', 'assets/img/cargo.png'],
            ['battleship1x1-Active', 'assets/img/raft-active.png'],
            ['battleship2x1-Active', 'assets/img/inflatable-active.png'],
            ['battleship3x1-Active', 'assets/img/gondola-active.png'],
            ['battleship4x1-Active', 'assets/img/cargo-active.png'],
            ['githubInactive', 'assets/img/githubInactive.png'],
            ['githubActive', 'assets/img/githubActive.png'],
            ['changeLogSceneBackground', 'assets/img/changeLogSceneBackground.jpg'],
        ];
        images.forEach(([key, path]) => this.load.image(key, path));

        // Carica WebFont Loader
        this.load.script("webfont", "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js");

        const audios = [
            ['menuMusic', 'assets/audio/Overkill - After Dark 8 Bit Cover.mp3'],
            ['clickSound', 'assets/audio/sfxMouseClick.mp3'],
            ['placeShipSound', 'assets/audio/sfxPlaceShip.mp3'],
        ];
        audios.forEach(([key, path]) => this.load.audio(key, path));
    }

    // Imposta il filtro NEAREST solo sulle texture delle battleship
    setBattleshipTexturesPixelPerfect() {
        ["battleship1x1", "battleship2x1", "battleship3x1", "battleship4x1"].forEach(key => {
            const tex = this.textures.get(key);
            if (tex?.setFilter) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
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
            active: () => this.startWithLanguage(),
            inactive: () => this.startWithLanguage()
        });
    }

    startWithLanguage() {
        this.setLanguageFromBrowser();
        this.scene.start("StartScene");
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
