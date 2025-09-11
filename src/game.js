import BootScene from "./scenes/BootScene.js";
import StartScene from "./scenes/StartScene.js";
import MainMenuScene from "./scenes/MainMenuScene.js";
import { colors } from "./colors.js";

const config = {
    // AUTO = sceglie WebGL o Canvas
    type: Phaser.AUTO,
    // dove montare il canvas
    parent: "game",
    backgroundColor: colors.matisse,
    scene: [BootScene, StartScene, MainMenuScene],
    scale: {
        width: 900,
        height: 600,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        mode: Phaser.Scale.FIT,
    }
};

new Phaser.Game(config);
