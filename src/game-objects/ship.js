import { colors } from "../colors.js";

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

        // Celle adiacenti e occupate
        this.adjacentCells = config.adjacentCells || [];
        this.adjacentSquares = [];
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
        this.adjacentSquares = [];
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

                // Only create a visible adjacent square and mark the grid if the cell is currently empty
                if (!occupiedGrid[adjRow][adjCol]) {
                    const square = this.scene.add.rectangle(
                        gridX + adjCol * this.cellSize + 2,
                        gridY + adjRow * this.cellSize + 2,
                        28, 28,
                        Phaser.Display.Color.HexStringToColor(colors.madang).color
                    ).setOrigin(0).setAlpha(0);
                    square.setDepth(-1); // Metti il quadrato sotto la nave
                    // attach coords so we can clean up safely later
                    square._adjRow = adjRow;
                    square._adjCol = adjCol;
                    this.adjacentSquares.push(square);
                    occupiedGrid[adjRow][adjCol] = square; // Segna la cella come occupata (solo dai quadrati creati qui)
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

        // Libera i quadrati adiacenti creati da questa nave
        this.adjacentSquares.forEach(square => {
            const r = square._adjRow;
            const c = square._adjCol;
            if (r !== undefined && c !== undefined && occupiedGrid[r][c] === square) {
                occupiedGrid[r][c] = null;
            }
            square.destroy();
        });
        this.adjacentSquares = [];

        // Non cancellare le celle in adjacentCells: sono solo coordinate e potrebbero essere ora occupate da altri oggetti
        this.adjacentCells = [];
        this.isPlaced = false;
    }

    showAdjacentCells(delay = 0) {
        this.scene.time.delayedCall(delay, () => {
            this.adjacentSquares.forEach(square => square.setAlpha(1));
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
            dragSound: this.dragSound
        };
    }
}
