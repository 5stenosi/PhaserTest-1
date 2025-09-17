export class Ship extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x - posizione iniziale x
     * @param {number} y - posizione iniziale y
     * @param {Object} config - configurazione nave
     */
    constructor(scene, x, y, config) {
        super(scene, x, y);
        this.widthCells = config.width || 1;
        this.heightCells = config.height || 1;
        this.cellSize = config.cellSize || 32;
        this.isPlaced = false;

        // Supporta colori stringa (es. da colors.js) o numerici
        let color = config.color || 0x888888;
        if (typeof color === 'string' && color.startsWith('#')) {
            color = parseInt(color.replace('#', '0x'));
        }
        this.color = color;

        if (config.spriteKey) {
            // Usa uno sprite per la nave
            this.shipSprite = scene.add.sprite(0, 0, config.spriteKey)
                .setOrigin(0)
                .setDisplaySize(this.widthCells * this.cellSize, this.heightCells * this.cellSize);
            this.add(this.shipSprite);
        } else {
            // Disegna la nave come griglia di rettangoli (placeholder)
            for (let ix = 0; ix < this.widthCells; ix++) {
                for (let iy = 0; iy < this.heightCells; iy++) {
                    const rect = scene.add.rectangle(
                        ix * this.cellSize,
                        iy * this.cellSize,
                        this.cellSize - 4, this.cellSize - 4,
                        this.color
                    ).setOrigin(0);
                    this.add(rect);
                }
            }
        }

        // Aggiungi prima il container alla scena
        scene.add.existing(this);

        this.setSize(
            this.widthCells * this.cellSize,
            this.heightCells * this.cellSize
        );

        // Rendi il container interattivo per il drag
        this.setInteractive(new Phaser.Geom.Rectangle(
            this.widthCells * this.cellSize / 2,
            this.heightCells * this.cellSize / 2,
            this.widthCells * this.cellSize,
            this.heightCells * this.cellSize
        ), Phaser.Geom.Rectangle.Contains);

        // Abilita drag SOLO dopo che è stato aggiunto e reso interattivo
        scene.input.setDraggable(this);
    }

}
