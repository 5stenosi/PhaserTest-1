import { TextButton } from "../game-objects/text-button.js";
import { DashedLine } from "../game-objects/dashed-line.js";
import { ImageButton } from "../game-objects/image-button.js";
import { PopupManager } from "../managers/popup-manager.js";
import { I18n } from "../i18n/i18n.js";
import { colors } from "../colors.js";
import { Ship } from "../game-objects/ship.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    create() {
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "gameSceneBackground")
            .setOrigin(0.5)
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
            .setDepth(-1);

        this.quitButton = new TextButton(this, 35, 575, I18n.t("quitGame").toUpperCase(), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "16px",
            color: colors.matisse,
            activeColor: colors.tacao,
            backgroundColor: colors.tacao,
            activeBackground: colors.matisse
        }).setOrigin(0, 1);
        this.add.existing(this.quitButton);

        this.quitButton.on('buttonclick', () => {
            this.sound.play('clickSound');
            this.scene.start('SelectionScene');
        });

    }
}
