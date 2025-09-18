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

        // Store adjacent cell data separately from visual elements
        this.adjacentCells = [];
        this.gridPosition = { row: -1, col: -1 };

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

    occupyGrid(startRow, startCol, occupiedGrid, gridX = 0, gridY = 0) {
        // Store grid position
        this.gridPosition = { row: startRow, col: startCol };
        
        // Clear previous adjacent cells data
        this.adjacentCells = [];

        // Marca le celle occupate dalla nave
        for (let ix = 0; ix < this.widthCells; ix++) {
            for (let iy = 0; iy < this.heightCells; iy++) {
                occupiedGrid[startRow + iy][startCol + ix] = this;
            }
        }

        // Calculate and store adjacent cells data
        const gridSize = occupiedGrid.length;
        for (let dx = -1; dx <= this.widthCells; dx++) {
            for (let dy = -1; dy <= this.heightCells; dy++) {
                const adjRow = startRow + dy;
                const adjCol = startCol + dx;
                if (
                    adjRow >= 0 && adjRow < gridSize &&
                    adjCol >= 0 && adjCol < gridSize &&
                    !occupiedGrid[adjRow][adjCol] // Solo se la cella non è già occupata
                ) {
                    // Store adjacent cell data
                    const adjacentCellData = {
                        row: adjRow,
                        col: adjCol,
                        x: gridX + adjCol * this.cellSize + 2,
                        y: gridY + adjRow * this.cellSize + 2
                    };
                    this.adjacentCells.push(adjacentCellData);
                    
                    // Create visual element
                    const square = this.scene.add.rectangle(
                        adjacentCellData.x,
                        adjacentCellData.y,
                        28, 28,
                        Phaser.Display.Color.HexStringToColor(colors.tacao).color
                    ).setOrigin(0);
                    square.setDepth(-1); // Metti il quadrato sotto la nave
                    
                    // Store reference to visual element in the data
                    adjacentCellData.visual = square;
                    
                    occupiedGrid[adjRow][adjCol] = square; // Segna la cella come occupata
                }
            }
        }

        this.isPlaced = true;
    }

    occupyGridWithDelay(startRow, startCol, occupiedGrid, gridX = 0, gridY = 0, delay = 0) {
        return new Promise((resolve) => {
            // Store grid position
            this.gridPosition = { row: startRow, col: startCol };
            
            // Clear previous adjacent cells data
            this.adjacentCells = [];

            // Marca le celle occupate dalla nave
            for (let ix = 0; ix < this.widthCells; ix++) {
                for (let iy = 0; iy < this.heightCells; iy++) {
                    occupiedGrid[startRow + iy][startCol + ix] = this;
                }
            }

            // Calculate and store adjacent cells data
            const gridSize = occupiedGrid.length;
            for (let dx = -1; dx <= this.widthCells; dx++) {
                for (let dy = -1; dy <= this.heightCells; dy++) {
                    const adjRow = startRow + dy;
                    const adjCol = startCol + dx;
                    if (
                        adjRow >= 0 && adjRow < gridSize &&
                        adjCol >= 0 && adjCol < gridSize &&
                        !occupiedGrid[adjRow][adjCol] // Solo se la cella non è già occupata
                    ) {
                        // Store adjacent cell data
                        const adjacentCellData = {
                            row: adjRow,
                            col: adjCol,
                            x: gridX + adjCol * this.cellSize + 2,
                            y: gridY + adjRow * this.cellSize + 2
                        };
                        this.adjacentCells.push(adjacentCellData);
                        occupiedGrid[adjRow][adjCol] = 'reserved'; // Temporarily reserve the cell
                    }
                }
            }

            // Create visual elements with delay
            if (delay > 0) {
                setTimeout(() => {
                    this.createAdjacentCellVisuals(occupiedGrid);
                    this.isPlaced = true;
                    resolve();
                }, delay);
            } else {
                this.createAdjacentCellVisuals(occupiedGrid);
                this.isPlaced = true;
                resolve();
            }
        });
    }

    createAdjacentCellVisuals(occupiedGrid) {
        this.adjacentCells.forEach(cellData => {
            const square = this.scene.add.rectangle(
                cellData.x,
                cellData.y,
                28, 28,
                Phaser.Display.Color.HexStringToColor(colors.tacao).color
            ).setOrigin(0);
            square.setDepth(-1);
            
            // Store reference to visual element
            cellData.visual = square;
            
            // Update grid with visual element
            occupiedGrid[cellData.row][cellData.col] = square;
        });
    }

    freeGrid(occupiedGrid) {
        // Free cells occupied by the ship
        for (let r = 0; r < occupiedGrid.length; r++) {
            for (let c = 0; c < occupiedGrid[r].length; c++) {
                if (occupiedGrid[r][c] === this) {
                    occupiedGrid[r][c] = null;
                }
            }
        }

        // Free adjacent cells and destroy their visual elements
        this.adjacentCells.forEach(cellData => {
            if (cellData.visual) {
                cellData.visual.destroy();
            }
            if (occupiedGrid[cellData.row] && occupiedGrid[cellData.row][cellData.col]) {
                // Only free if it's our visual element or reserved marker
                if (occupiedGrid[cellData.row][cellData.col] === cellData.visual || 
                    occupiedGrid[cellData.row][cellData.col] === 'reserved') {
                    occupiedGrid[cellData.row][cellData.col] = null;
                }
            }
        });

        // Clear stored data
        this.adjacentCells = [];
        this.gridPosition = { row: -1, col: -1 };
        this.isPlaced = false;
    }

    isAdjacentCellShared(row, col, occupiedGrid) {
        const gridSize = occupiedGrid.length;
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1], // Cardinal directions
            [-1, -1], [-1, 1], [1, -1], [1, 1] // Diagonal directions
        ];

        for (const [dr, dc] of directions) {
            const adjRow = row + dr;
            const adjCol = col + dc;
            if (
                adjRow >= 0 && adjRow < gridSize &&
                adjCol >= 0 && adjCol < gridSize &&
                occupiedGrid[adjRow][adjCol] instanceof Ship &&
                occupiedGrid[adjRow][adjCol] !== this
            ) {
                return true; // La cella è condivisa con un'altra nave
            }
        }
        return false;
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
            gridPosition: this.gridPosition,
            adjacentCells: this.adjacentCells.map(cell => ({
                row: cell.row,
                col: cell.col,
                x: cell.x,
                y: cell.y
                // Don't store visual reference as it won't be valid across scenes
            }))
        };
    }

    restoreAdjacentCells(savedData, occupiedGrid) {
        if (savedData.adjacentCells && savedData.gridPosition) {
            this.gridPosition = savedData.gridPosition;
            this.adjacentCells = savedData.adjacentCells.map(cellData => ({
                row: cellData.row,
                col: cellData.col,
                x: cellData.x,
                y: cellData.y
            }));
            
            // Recreate visual elements
            this.createAdjacentCellVisuals(occupiedGrid);
        }
    }
}
