import { colors } from "../colors.js";

export class Ship extends Phaser.GameObjects.Container {
    constructor(scene, x, y, config) {
        super(scene, x, y);

        this.widthCells = config.width || 1;
        this.heightCells = config.height || 1;
        this.cellSize = config.cellSize || 32;
        this.isPlaced = false;

        // Configurazione pattern a pois per celle adiacenti
        this.polkaDotRadius = config.polkaDotRadius || 1;
        this.polkaDotPositions = config.polkaDotPositions || [
            [6, 6], [16, 6], [26, 6],
            [6, 16], [16, 16], [26, 16],
            [6, 26], [16, 26], [26, 26]
        ];

        // Per salvataggio/reset posizione iniziale
        this.initialX = x;
        this.initialY = y;

        // Celle adiacenti e occupate
        this.adjacentCells = config.adjacentCells || [];
        this.adjacentGraphics = [];
        this.occupiedCells = [];

        // Sprite keys
        this.spriteKeyInactive = config.spriteKeyInactive || null;
        this.spriteKeyActive = config.spriteKeyActive || null;

        // Stato attivo
        this.activeState = false;

        // Suono di drag
        this.dragSound = config.dragSound || null;

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
                        Phaser.Display.Color.HexStringToColor(colors.tacao).color
                    ).setOrigin(0);
                    this.add(rect);
                }
            }
        }

        // Aggiungi il container alla scena
        scene.add.existing(this);

        this.setSize(
            this.widthCells * this.cellSize,
            this.heightCells * this.cellSize
        );

        // Rendi interattivo per il drag
        this.setInteractive(new Phaser.Geom.Rectangle(
            this.widthCells * this.cellSize / 2,
            this.heightCells * this.cellSize / 2,
            this.widthCells * this.cellSize,
            this.heightCells * this.cellSize
        ), Phaser.Geom.Rectangle.Contains);

        // Abilita drag
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

    occupyGrid(startRow, startCol, occupiedGrid, gridX = 0, gridY = 0) {
        // Marca le celle occupate dalla nave
        this.occupiedCells = [];
        for (let ix = 0; ix < this.widthCells; ix++) {
            for (let iy = 0; iy < this.heightCells; iy++) {
                const row = startRow + iy;
                const col = startCol + ix;
                occupiedGrid[row][col] = this;
                this.occupiedCells.push({ row, col });
            }
        }

        // Aggiungi celle adiacenti come occupate
        const gridSize = occupiedGrid.length;
        this.adjacentCells = [];
        // Keep track only of squares this ship creates so we don't override others'
        this.adjacentGraphics = [];
        // Save grid origin to compute cleanup later
        this._gridX = gridX;
        this._gridY = gridY;
        for (let dx = -1; dx <= this.widthCells; dx++) {
            for (let dy = -1; dy <= this.heightCells; dy++) {
                const adjRow = startRow + dy;
                const adjCol = startCol + dx;

                // Skip out of bounds
                if (adjRow < 0 || adjRow >= gridSize || adjCol < 0 || adjCol >= gridSize) continue;

                // Skip cells that are part of this ship
                if (adjRow >= startRow && adjRow < startRow + this.heightCells && adjCol >= startCol && adjCol < startCol + this.widthCells) continue;

                // If there's another ship occupying that cell, don't mark it as adjacent (can't place nor mark)
                if (occupiedGrid[adjRow][adjCol] instanceof Ship) continue;

                // Always record the adjacent coordinate for this ship (even if another ship already created an adjacent square there)
                this.adjacentCells.push({ row: adjRow, col: adjCol });

                // Only create a visible adjacent polka dot pattern and mark the grid if the cell is currently empty
                if (!occupiedGrid[adjRow][adjCol]) {
                    const graphics = this.scene.add.graphics();
                    const color = Phaser.Display.Color.HexStringToColor(colors.madang).color;
                    graphics.fillStyle(color);
                    const cellX = gridX + adjCol * this.cellSize;
                    const cellY = gridY + adjRow * this.cellSize;
                    // Draw polka dots based on configuration
                    this.polkaDotPositions.forEach(([offsetX, offsetY]) => {
                        graphics.fillCircle(cellX + offsetX, cellY + offsetY, this.polkaDotRadius);
                    });
                    graphics.setAlpha(0);
                    graphics.setDepth(-1); // Metti il pattern sotto la nave
                    // attach coords so we can clean up safely later
                    graphics._adjRow = adjRow;
                    graphics._adjCol = adjCol;
                    this.adjacentGraphics.push(graphics);
                    occupiedGrid[adjRow][adjCol] = graphics; // Segna la cella come occupata (solo dai pattern creati qui)
                }
            }
        }

        this.isPlaced = true;
    }

    freeGrid(occupiedGrid) {
        // Libera le celle occupate dalla nave
        this.occupiedCells.forEach(({ row, col }) => {
            // Clear only if the grid still references this ship
            if (occupiedGrid[row][col] === this) {
                occupiedGrid[row][col] = null;
            }
        });
        this.occupiedCells = [];

        // Libera i pattern adiacenti creati da questa nave
        this.adjacentGraphics.forEach(graphics => {
            const r = graphics._adjRow;
            const c = graphics._adjCol;
            if (r !== undefined && c !== undefined && occupiedGrid[r][c] === graphics) {
                occupiedGrid[r][c] = null;
            }
            graphics.destroy();
        });
        this.adjacentGraphics = [];

        // Non cancellare le celle in adjacentCells: sono solo coordinate e potrebbero essere ora occupate da altri oggetti
        this.adjacentCells = [];
        this.isPlaced = false;
    }

    showAdjacentCells(delay = 0) {
        this.scene.time.delayedCall(delay, () => {
            this.adjacentGraphics.forEach(graphics => graphics.setAlpha(1));
        });
    }

    resetPosition() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.isPlaced = false;
    }

    animateToPosition(scene, startX, startY, targetX, targetY, duration = 250) {
        return new Promise(resolve => {
            this.x = startX;
            this.y = startY;
            scene.tweens.add({
                targets: this,
                x: targetX,
                y: targetY,
                duration,
                ease: 'Cubic.easeInOut',
                onComplete: () => {
                    resolve();
                }
            });
        });
    }

    getState() {
        return {
            x: this.x,
            y: this.y,
            width: this.widthCells,
            height: this.heightCells,
            active: this.activeState,
            spriteKeyInactive: this.spriteKeyInactive || null,
            spriteKeyActive: this.spriteKeyActive || null,
            adjacentCells: this.adjacentCells,
            occupiedCells: this.occupiedCells,
            dragSound: this.dragSound,
            polkaDotRadius: this.polkaDotRadius,
            polkaDotPositions: this.polkaDotPositions
        };
    }
}
