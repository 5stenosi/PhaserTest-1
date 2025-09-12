import BootScene from "./scenes/BootScene.js";
import StartScene from "./scenes/StartScene.js";
import MainMenuScene from "./scenes/MainMenuScene.js";
import ChangeLogScene from "./scenes/ChangeLogScene.js";
import SelectionScene from "./scenes/SelectionScene.js";
import { colors } from "./colors.js";
import { I18n } from "./i18n/i18n.js";


// Imposta true per la dev mode
const DEV_MODE = false;
const START_SCENE = DEV_MODE ? "SelectionScene" : "BootScene";

// Scegli la lingua di default per la dev mode ("en" o "it")
const DEV_LANG = "en";
I18n.setLang(DEV_LANG);

const config = {
    type: Phaser.AUTO,
    parent: "game",
    backgroundColor: colors.matisse,
    scene: START_SCENE === "SelectionScene"
        ? [SelectionScene, BootScene, StartScene, MainMenuScene]
        : [BootScene, StartScene, MainMenuScene, ChangeLogScene, SelectionScene],
    start: START_SCENE,
    scale: {
        width: 900,
        height: 600,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        mode: Phaser.Scale.FIT,
    }
};

new Phaser.Game(config);
