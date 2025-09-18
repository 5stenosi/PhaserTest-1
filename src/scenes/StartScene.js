import { ImageButton } from "../game-objects/image-button.js";

export default class StartScene extends Phaser.Scene {
    constructor() {
        super("StartScene");
    }

    create() {
        // Riproduci musica di sottofondo in loop
        this.menuMusic = this.sound.add('menuMusic', {
            loop: true,
        });

        this.startButton = new ImageButton(
            this,
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'startButtonInactive',
            'startButtonActive',
            { type: 'circle' }
        );

        this.startButton.on('buttonclick', () => {
            this.scene.start("MainMenuScene");
            this.sound.play('clickSound');
        });
        
        this.add.existing(this.startButton);
    }
}
