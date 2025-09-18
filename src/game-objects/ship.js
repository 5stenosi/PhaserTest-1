export class Ship extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config) {
        super(scene, x, y);

        this.widthCells = config.width || 1;
        this.heightCells = config.height || 1;
        this.cellSize = config.cellSize || 32;
        this.isPlaced = false;

        // Per salvataggio/reset posizione iniziale
        this.initialX = x;
        this.initialY = y;

        // Sprite keys
        this.spriteKeyInactive = config.spriteKeyInactive || null;
        this.spriteKeyActive = config.spriteKeyActive || null;

        // Sprite attuale
        this.activeState = false;

        if (this.spriteKeyInactive || this.spriteKeyActive) {
            // Sprite INACTIVE
            if (this.spriteKeyInactive) {
                this.shipSpriteInactive = scene.add.sprite(0, 0, this.spriteKeyInactive)
                    .setOrigin(0)
                    .setDisplaySize(this.widthCells * this.cellSize, this.heightCells * this.cellSize);
                this.add(this.shipSpriteInactive);
            }

            // Sprite ACTIVE
            if (this.spriteKeyActive) {
                this.shipSpriteActive = scene.add.sprite(0, 0, this.spriteKeyActive)
                    .setOrigin(0)
                    .setDisplaySize(this.widthCells * this.cellSize, this.heightCells * this.cellSize);
                this.add(this.shipSpriteActive);
            }

            // Mostra solo quello inattivo all'inizio
            this.updateSpriteVisibility();
        } else {
            // Fallback: rettangoli
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

    updateSpriteVisibility() {
        if (this.shipSpriteInactive) {
            this.shipSpriteInactive.setVisible(!this.activeState);
        }
        if (this.shipSpriteActive) {
            this.shipSpriteActive.setVisible(this.activeState);
        }
    }

    setActiveState(isActive) {
        this.activeState = isActive;
        this.updateSpriteVisibility();
    }

    canPlaceAt(startRow, startCol, occupiedGrid) {
        const gridSize = occupiedGrid.length;
        if (
            startCol < 0 ||
            startRow < 0 ||
            startCol + this.widthCells > gridSize ||
            startRow + this.heightCells > gridSize
        ) {
            return false;
        }
        for (let ix = 0; ix < this.widthCells; ix++) {
            for (let iy = 0; iy < this.heightCells; iy++) {
                if (
                    occupiedGrid[startRow + iy][startCol + ix] &&
                    occupiedGrid[startRow + iy][startCol + ix] !== this
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    occupyGrid(startRow, startCol, occupiedGrid) {
        for (let ix = 0; ix < this.widthCells; ix++) {
            for (let iy = 0; iy < this.heightCells; iy++) {
                occupiedGrid[startRow + iy][startCol + ix] = this;
            }
        }
        this.isPlaced = true;
    }

    freeGrid(occupiedGrid) {
        for (let r = 0; r < occupiedGrid.length; r++) {
            for (let c = 0; c < occupiedGrid[r].length; c++) {
                if (occupiedGrid[r][c] === this) {
                    occupiedGrid[r][c] = null;
                }
            }
        }
        this.isPlaced = false;
    }

    /**
     * Riposiziona la nave alla posizione iniziale
     */
    resetPosition() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.isPlaced = false;
    }

    animateToInitialPosition(scene, duration = 250) {
        return new Promise(resolve => {
            scene.tweens.add({
                targets: this,
                x: this.initialX,
                y: this.initialY,
                duration,
                ease: 'Cubic.easeInOut',
                onComplete: () => {
                    this.isPlaced = false;
                    resolve();
                }
            });
        });
    }

    /**
     * Restituisce lo stato serializzabile della nave
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            width: this.widthCells,
            height: this.heightCells,
            active: this.activeState,
            spriteKeyInactive: this.spriteKeyInactive || null,
            spriteKeyActive: this.spriteKeyActive || null
        };
    }
}
