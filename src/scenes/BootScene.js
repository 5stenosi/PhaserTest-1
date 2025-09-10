export default class BootScene extends Phaser.Scene {
    // Imposta a true per forzare almeno 1 secondo di caricamento
    static forceMinLoadTime = false;
    constructor() {
        super("BootScene");
    }

    preload() {
        // Background nero
        this.cameras.main.setBackgroundColor("#000000");

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        // Crea una graphics per disegnare un arco (stroke) come indicatore di caricamento
        this.loaderArc = this.add.graphics({ x: centerX, y: centerY });
        const radius = 50;
        const startAngle = Phaser.Math.DegToRad(-90); // inizia in alto
        const endAngle = Phaser.Math.DegToRad(-90 + 270); // 75% di cerchio (270°)
        this.loaderArc.lineStyle(10, 0xffffff, 1);
        this.loaderArc.beginPath();
        this.loaderArc.arc(0, 0, radius, startAngle, endAngle, false);
        this.loaderArc.strokePath();
        // Crea una tween per ruotare l'arco all'infinito
        this.tweens.add({
            targets: this.loaderArc,
            angle: 360,
            duration: 1000,
            repeat: -1
        });

        // Carica font con WebFont Loader
        this.load.script("webfont", "https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js");

        // Carica i cursori personalizzati
        this.load.image('cursor-default', 'assets/cursors/cursor-default.png');
    }

    create() {
        const useMinLoad = BootScene.forceMinLoadTime;
        if (useMinLoad) {
            this.bootStartTime = this.time.now;
        }
        WebFont.load({
            custom: {
                families: ["PixelOperator"], // deve corrispondere al nome in @font-face
            },
            active: () => {
                if (useMinLoad) {
                    const elapsed = this.time.now - this.bootStartTime;
                    const minDuration = 1000; // 1 secondo
                    if (elapsed >= minDuration) {
                        this.scene.start("MainMenuScene");
                    } else {
                        this.time.delayedCall(minDuration - elapsed, () => {
                            this.scene.start("MainMenuScene");
                        });
                    }
                } else {
                    this.scene.start("MainMenuScene");
                }
            },
        });
    }
}
