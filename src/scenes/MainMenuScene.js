import { TextButton } from "../game-objects/text-button.js";
import { I18n } from "../i18n/i18n.js";
import { translations } from "../i18n/translations.js";
import { colors } from "../colors.js";

export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super("MainMenuScene");
    }

    create() {
        // Titolo del gioco
        this.add.text(this.cameras.main.centerX, 50, "The Sea Has No Claim", {
            fontFamily: "PixelOperator",
            fontSize: "72px",
            color: colors.tacao,
        }).setOrigin(0.5, 0);


        // bottone lingua
        this.availableLangs = Object.keys(translations);
        this.currentLangIndex = 0;
        this.langButton = new TextButton(this, 35, 575, this.availableLangs[this.currentLangIndex], {
            fontFamily: "PixelOperator",
            fontSize: "48px",
            color: colors.tacao,
            activeColor: colors.matisse,
            backgroundColor: "rgba(0,0,0,0)",
            activeBackground: colors.tacao
        }, () => this.changeLanguage()).setOrigin(0, 1);
        this.add.existing(this.langButton);

        // bottone inizio gioco
        this.startButton = new TextButton(this, 865, 575, I18n.t('start').toUpperCase(), {
            fontFamily: "PixelOperator",
            fontSize: "48px",
            color: colors.tacao,
            activeColor: colors.matisse,
            backgroundColor: "rgba(0,0,0,0)",
            activeBackground: colors.tacao
        }).setOrigin(1, 1);
        this.add.existing(this.startButton);

        // collega il click del bottone lingua
        this.langButton.on('pointerup', () => {
            this.changeLanguage();
        });
    }

    changeLanguage() {
        // ciclo la lingua
        this.currentLangIndex = (this.currentLangIndex + 1) % this.availableLangs.length;
        const newLang = this.availableLangs[this.currentLangIndex];
        I18n.setLang(newLang);

        // aggiorna tutti i testi
        this.langButton.setText(newLang);
        this.startButton.setText(I18n.t('start').toUpperCase());
    }

}