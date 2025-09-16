import { TextButton } from "../game-objects/text-button.js";
import { I18n } from "../i18n/i18n.js";
import { colors } from "../colors.js";

export default class SelectionScene extends Phaser.Scene {
    constructor() {
        super("SelectionScene");
    }

    create() {
        this.cameras.main.setBackgroundColor(colors.tacao);


        // Titolo della scena
        this.titleText = this.add.text(this.cameras.main.centerX, 35, I18n.t("selectionSceneTitle"), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "48px",
            resolution: 2,
            color: colors.matisse,
            align: "center",
            wordWrap: { width: this.cameras.main.width - 50 },
            lineSpacing: 5,
        }).setOrigin(0.5, 0).setShadow(-8, 3, colors.tacao, 0);


        // bottone per tornare al menu principale
        this.backToMenuButton = new TextButton(this, 35, 575, I18n.t("backToMenu").toUpperCase(), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "32px",
            color: colors.matisse,
            activeColor: colors.tacao,
            backgroundColor: colors.tacao,
            activeBackground: colors.matisse
        }).setOrigin(0, 1);
        this.add.existing(this.backToMenuButton);

        this.backToMenuButton.on('buttonclick', () => {
            this.scene.start('MainMenuScene');
        });
    }



}