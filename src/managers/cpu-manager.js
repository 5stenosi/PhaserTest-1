import { Ship } from "../game-objects/ship.js";
import { shipsConfig } from "../config/ship-config.js";

export class CpuManager {
    constructor(scene, gridSize, cellSize, gridX, gridY, occupiedGrid, cpuShipsVisible = false) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.gridX = gridX;
        this.gridY = gridY;
        this.occupiedGrid = occupiedGrid;
        this.cpuShipsVisible = cpuShipsVisible;
        this.cpuShips = [];
        this.cpuHitGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null)); // Colpi della CPU sul giocatore

        // Stato per la modalità di caccia
        this.huntingMode = false;
        this.targetShip = null;
        this.lastHitRow = null;
        this.lastHitCol = null;
        this.direction = null; // 1 per destra, -1 per sinistra
        this.nextOffset = 0;
        this.consecutiveHits = 0;
    }

    placeShips() {
        this.cpuShips = [];

        shipsConfig.forEach(config => {
            const ship = new Ship(this.scene, 0, 0, {
                width: config.width,
                height: config.height,
                cellSize: this.cellSize,
                spriteKeyInactive: config.spriteKeyInactive,
                spriteKeyActive: config.spriteKeyActive,
                dragSound: config.dragSound
            });
            ship.setVisible(this.cpuShipsVisible);
            this.cpuShips.push(ship);
        });

        // Piazza tutte le navi non piazzate, ordinandole per dimensione decrescente
        const shipsToPlace = this.cpuShips.filter(ship => !ship.isPlaced).sort((a, b) => (b.widthCells * b.heightCells) - (a.widthCells * a.heightCells));
        shipsToPlace.forEach(ship => {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 1000) { // limite tentativi aumentato
                const startRow = Phaser.Math.Between(0, this.gridSize - ship.heightCells);
                const startCol = Phaser.Math.Between(0, this.gridSize - ship.widthCells);

                if (ship.canPlaceAt(startRow, startCol, this.occupiedGrid)) {
                    ship.occupyGrid(startRow, startCol, this.occupiedGrid, this.gridX, this.gridY);
                    ship.x = this.gridX + startCol * this.cellSize;
                    ship.y = this.gridY + startRow * this.cellSize;
                    placed = true;
                }

                attempts++;
            }
        });
    }

    getShips() {
        return this.cpuShips;
    }

    setShipsVisible(visible) {
        this.cpuShipsVisible = visible;
        this.cpuShips.forEach(ship => ship.setVisible(visible));
    }

    resetHunting() {
        this.huntingMode = false;
        this.targetShip = null;
        this.lastHitRow = null;
        this.lastHitCol = null;
        this.direction = null;
        this.nextOffset = 0;
        this.consecutiveHits = 0;
    }

    takeTurn() {
        if (this.scene.battleManager.gameOver) return;

        let row, col;

        if (this.huntingMode) {
            // Calcola la prossima cella nella direzione di caccia
            col = this.lastHitCol + this.direction * this.nextOffset;
            row = this.lastHitRow;

            // Se fuori dalla griglia
            if (col < 0 || col >= this.gridSize) {
                if (this.consecutiveHits === 1) {
                    // Cambia direzione
                    this.direction = -this.direction;
                    this.nextOffset = 1;
                    this.consecutiveHits = 0;
                    col = this.lastHitCol + this.direction * this.nextOffset;
                } else {
                    // Reset hunting mode se fuori e non primo colpo
                    this.resetHunting();
                    return this.takeTurn(); // Ricomincia con random
                }
            }

            // Se già colpita, salta (ma non dovrebbe accadere)
            if (this.cpuHitGrid[row][col] !== null) {
                this.nextOffset++;
                return this.takeTurn();
            }
        } else {
            // Colpo random
            do {
                row = Phaser.Math.Between(0, this.gridSize - 1);
                col = Phaser.Math.Between(0, this.gridSize - 1);
            } while (this.cpuHitGrid[row][col] !== null);
        }

        const hit = this.scene.playerOccupiedGrid[row][col];
        if (hit instanceof Ship) {
            // Colpito
            this.cpuHitGrid[row][col] = 'hit';
            const hitSprite = this.scene.add.image(
                this.scene.gridX + col * this.cellSize + this.cellSize / 2,
                this.scene.gridY + row * this.cellSize + this.cellSize / 2,
                'destroyedShip'
            );
            hitSprite.setDepth(1);
            this.scene.sound.play('shipExplosionSound');

            if (!this.huntingMode) {
                // Inizia hunting mode
                this.huntingMode = true;
                this.targetShip = hit;
                this.lastHitRow = row;
                this.lastHitCol = col;
                this.direction = Phaser.Math.Between(0, 1) ? 1 : -1; // destra o sinistra
                this.nextOffset = 1;
                this.consecutiveHits = 1;
            } else {
                // Continua hunting
                this.consecutiveHits++;
                this.nextOffset++;
            }

            // Controlla se la nave è affondata
            if (this.targetShip.occupiedCells.every(({ row: r, col: c }) => this.cpuHitGrid[r][c] === 'hit')) {
                // Nave affondata, mostra cross nelle celle adiacenti
                this.targetShip.adjacentCells.forEach(({ row: adjRow, col: adjCol }) => {
                    if (this.cpuHitGrid[adjRow][adjCol] !== 'hit') {
                        this.cpuHitGrid[adjRow][adjCol] = 'adjacent';
                        const crossSprite = this.scene.add.image(
                            this.scene.gridX + adjCol * this.cellSize + this.cellSize / 2,
                            this.scene.gridY + adjRow * this.cellSize + this.cellSize / 2,
                            'cross-1'
                        );
                        crossSprite.setDepth(1);
                    }
                });
                // Reset hunting mode
                this.resetHunting();
            }

            // Continua il turno CPU
            this.scene.battleManager.checkWinCondition();
            if (!this.scene.battleManager.gameOver) {
                setTimeout(() => this.takeTurn(), 1000);
            }
        } else {
            // Mancato
            this.cpuHitGrid[row][col] = 'miss';
            const missSprite = this.scene.add.image(
                this.scene.gridX + col * this.cellSize + this.cellSize / 2,
                this.scene.gridY + row * this.cellSize + this.cellSize / 2,
                'cross-1'
            );
            missSprite.setDepth(1);
            this.scene.sound.play('waterBombSound');

            if (this.huntingMode) {
                if (this.consecutiveHits === 1) {
                    // Secondo colpo mancato, cambia direzione
                    this.direction = -this.direction;
                    this.nextOffset = 1;
                    this.consecutiveHits = 0;
                } else if (this.consecutiveHits >= 2) {
                    // Mancato dopo consecutivi, cambia direzione
                    this.direction = -this.direction;
                    this.nextOffset = 1;
                    this.consecutiveHits = 0;
                }
                // Fine turno, ma rimane in huntingMode
                this.scene.battleManager.endCpuTurn();
            } else {
                // Fine turno
                this.scene.battleManager.endCpuTurn();
            }
        }
    }
}