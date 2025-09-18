import BootScene from "./scenes/BootScene.js";
import StartScene from "./scenes/StartScene.js";
import MainMenuScene from "./scenes/MainMenuScene.js";
import ChangeLogScene from "./scenes/ChangeLogScene.js";
import SelectionScene from "./scenes/SelectionScene.js";
import { colors } from "./colors.js";

const config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: colors.matisse,
    scene: [BootScene, StartScene, MainMenuScene, SelectionScene, ChangeLogScene],
    start: "BootScene",
    scale: {
        width: 900,
        height: 600,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        mode: Phaser.Scale.FIT,
    }
};

new Phaser.Game(config);
