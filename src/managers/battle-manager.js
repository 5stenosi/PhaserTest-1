import { Ship } from "../game-objects/ship.js";
import { PopupManager } from "./popup-manager.js";
import { I18n } from "../i18n/i18n.js";

export class BattleManager {
    constructor(scene, gridSize, cellSize, playerGridX, playerGridY, cpuGridX, cpuGridY, playerOccupiedGrid, cpuOccupiedGrid, cpuManager) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.playerGridX = playerGridX;
        this.playerGridY = playerGridY;
        this.cpuGridX = cpuGridX;
        this.cpuGridY = cpuGridY;
        this.playerOccupiedGrid = playerOccupiedGrid;
        this.cpuOccupiedGrid = cpuOccupiedGrid;
        this.cpuManager = cpuManager;

        // Griglie per i colpi
        this.playerHitGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null)); // Colpi del giocatore sulla CPU
        this.cpuHitGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null)); // Colpi della CPU sul giocatore

        this.isPlayerTurn = true;
        this.gameOver = false;
        this.isAutoMode = false;
        this.speedMultiplier = 1;

        // Stato per la modalità di caccia del giocatore simulato
        this.playerHuntingMode = false;
        this.playerTargetShip = null;
        this.playerLastHitRow = null;
        this.playerLastHitCol = null;
        this.playerDirection = null; // 1 per destra, -1 per sinistra
        this.playerNextOffset = 0;
        this.playerConsecutiveHits = 0;

        // Celle interattive per la griglia CPU
        this.cpuGridCells = [];
        this.createInteractiveCpuGrid();
    }

    resetPlayerHunting() {
        this.playerHuntingMode = false;
        this.playerTargetShip = null;
        this.playerLastHitRow = null;
        this.playerLastHitCol = null;
        this.playerDirection = null;
        this.playerNextOffset = 0;
        this.playerConsecutiveHits = 0;
    }

    setSpeedMode(is2x) {
        this.speedMultiplier = is2x ? 0.5 : 1;
    }

    setAutoMode(autoMode) {
        this.isAutoMode = autoMode;
        if (!autoMode) {
            // Disabilita auto mode
            this.cpuGridCells.forEach(cell => {
                cell.setInteractive(true);
            });
            // Se non è turno giocatore, forzalo a turno giocatore per permettere il gioco manuale
            if (!this.isPlayerTurn) {
                this.isPlayerTurn = true;
            }
        } else {
            // Abilita auto mode
            this.cpuGridCells.forEach(cell => {
                cell.setInteractive(false);
            });
            // Se è turno giocatore e il gioco non è finito, simula turno
            if (this.isPlayerTurn && !this.gameOver) {
                this.scene.time.delayedCall(2000 * this.speedMultiplier, () => this.simulatePlayerTurn());
            }
        }
    }

    createInteractiveCpuGrid() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = this.scene.add.rectangle(
                    this.cpuGridX + col * this.cellSize + this.cellSize / 2,
                    this.cpuGridY + row * this.cellSize + this.cellSize / 2,
                    this.cellSize,
                    this.cellSize
                );
                cell.setInteractive();
                cell.row = row;
                cell.col = col;
                cell.on('pointerdown', () => this.handlePlayerAttack(cell.row, cell.col));
                this.cpuGridCells.push(cell);
            }
        }
    }

    handlePlayerAttack(row, col) {
        if (!this.isPlayerTurn || this.gameOver || this.playerHitGrid[row][col] !== null) return;

        const hit = this.cpuOccupiedGrid[row][col];
        if (hit instanceof Ship) {
            // Colpito
            this.playerHitGrid[row][col] = 'hit';
            const hitSprite = this.scene.add.image(
                this.cpuGridX + col * this.cellSize + this.cellSize / 2,
                this.cpuGridY + row * this.cellSize + this.cellSize / 2,
                'destroyedShip'
            );
            hitSprite.setDepth(1);
            this.scene.sound.play('shipExplosionSound');

            // Controlla se la nave è affondata
            if (hit.occupiedCells.every(({ row: r, col: c }) => this.playerHitGrid[r][c] === 'hit')) {
                // Nave affondata, mostra cross nelle celle adiacenti
                hit.adjacentCells.forEach(({ row: adjRow, col: adjCol }) => {
                    if (this.playerHitGrid[adjRow][adjCol] !== 'hit') {
                        this.playerHitGrid[adjRow][adjCol] = 'adjacent';
                        const crossSprite = this.scene.add.image(
                            this.cpuGridX + adjCol * this.cellSize + this.cellSize / 2,
                            this.cpuGridY + adjRow * this.cellSize + this.cellSize / 2,
                            'cross-1'
                        );
                        crossSprite.setDepth(1);
                    }
                });
                // Reset hunting mode
                this.resetPlayerHunting();
            } else {
                // Aggiorna stato hunting
                if (!this.playerHuntingMode) {
                    // Inizia hunting mode
                    this.playerHuntingMode = true;
                    this.playerTargetShip = hit;
                    this.playerLastHitRow = row;
                    this.playerLastHitCol = col;
                    this.playerDirection = Phaser.Math.Between(0, 1) ? 1 : -1; // destra o sinistra
                    this.playerNextOffset = 1;
                    this.playerConsecutiveHits = 1;
                } else {
                    // Continua hunting
                    this.playerConsecutiveHits++;
                    this.playerNextOffset++;
                }
            }

            // Continua turno se AUTO attivo e non game over
            this.checkWinCondition();
            if (this.isAutoMode && !this.gameOver) {
                this.scene.time.delayedCall(1000 * this.speedMultiplier, () => this.simulatePlayerTurn());
            }
        } else {
            // Mancato
            this.playerHitGrid[row][col] = 'miss';
            const missSprite = this.scene.add.image(
                this.cpuGridX + col * this.cellSize + this.cellSize / 2,
                this.cpuGridY + row * this.cellSize + this.cellSize / 2,
                'cross-1'
            );
            missSprite.setDepth(1);
            this.scene.sound.play('waterBombSound');
            if (this.playerHuntingMode) {
                if (this.playerConsecutiveHits === 1) {
                    // Secondo colpo mancato, cambia direzione
                    this.playerDirection = -this.playerDirection;
                    this.playerNextOffset = 1;
                    this.playerConsecutiveHits = 0;
                } else if (this.playerConsecutiveHits >= 2) {
                    // Mancato dopo consecutivi, cambia direzione
                    this.playerDirection = -this.playerDirection;
                    this.playerNextOffset = 1;
                    this.playerConsecutiveHits = 0;
                }
                // Fine turno, ma rimane in huntingMode
                this.endPlayerTurn();
            } else {
                this.endPlayerTurn();
            }
        }
    }

    endPlayerTurn() {
        this.isPlayerTurn = false;
        this.scene.handleTurnArrowClick();
        if (!this.gameOver) {
            this.scene.time.delayedCall(2000 * this.speedMultiplier, () => this.cpuManager.takeTurn());
        }
    }

    endCpuTurn() {
        this.checkWinCondition();
        this.scene.handleTurnArrowClick();
        this.scene.time.delayedCall(2000 * this.speedMultiplier, () => {
            if (this.isAutoMode) {
                this.isPlayerTurn = true;
                if (!this.gameOver) {
                    this.simulatePlayerTurn();
                }
            } else {
                this.isPlayerTurn = true;
                this.checkWinCondition();
            }
        });
    }

    simulatePlayerTurn() {
        if (this.gameOver) return;

        let row, col;

        if (this.playerHuntingMode) {
            // Calcola la prossima cella nella direzione di caccia
            col = this.playerLastHitCol + this.playerDirection * this.playerNextOffset;
            row = this.playerLastHitRow;

            // Se fuori dalla griglia
            if (col < 0 || col >= this.gridSize) {
                if (this.playerConsecutiveHits === 1) {
                    // Cambia direzione
                    this.playerDirection = -this.playerDirection;
                    this.playerNextOffset = 1;
                    this.playerConsecutiveHits = 0;
                    col = this.playerLastHitCol + this.playerDirection * this.playerNextOffset;
                } else {
                    // Reset hunting mode se fuori e non primo colpo
                    this.resetPlayerHunting();
                    return this.simulatePlayerTurn(); // Ricomincia con random
                }
            }

            // Se già colpita, salta
            if (this.playerHitGrid[row][col] !== null) {
                this.playerNextOffset++;
                return this.simulatePlayerTurn();
            }
        } else {
            // Colpo random
            const availableCells = [];
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (this.playerHitGrid[r][c] === null) {
                        availableCells.push({ row: r, col: c });
                    }
                }
            }
            if (availableCells.length > 0) {
                const randomCell = availableCells[Math.floor(Math.random() * availableCells.length)];
                row = randomCell.row;
                col = randomCell.col;
            } else {
                return; // Nessuna cella disponibile
            }
        }

        this.handlePlayerAttack(row, col);
    }

    checkWinCondition() {
        // Controlla se tutte le navi CPU sono distrutte
        const cpuShipsDestroyed = this.cpuManager.getShips().every(ship =>
            ship.occupiedCells.every(({ row, col }) => this.playerHitGrid[row][col] === 'hit')
        );

        // Controlla se tutte le navi giocatore sono distrutte
        // Assumendo che scene abbia playerShips
        const playerShipsDestroyed = this.scene.playerShips.every(ship =>
            ship.occupiedCells.every(({ row, col }) => this.cpuHitGrid[row][col] === 'hit')
        );

        if (cpuShipsDestroyed) {
            this.gameOver = true;
            // Aggiungi overlay trasparente per bloccare interazioni
            const overlay = this.scene.add.rectangle(this.scene.cameras.main.centerX, this.scene.cameras.main.centerY, this.scene.cameras.main.width, this.scene.cameras.main.height, 0x000000, 0);
            overlay.setInteractive();
            overlay.setDepth(10);
            // Mostra vittoria giocatore
            PopupManager.show(I18n.t("playerWin"), 3000, null, null, null, null, 'double', '48px', 'PixelOperator8-Bold', true);
            this.scene.time.delayedCall(6000, () => {
                this.scene.scene.start("MainMenuScene");
            });
        } else if (playerShipsDestroyed) {
            this.gameOver = true;
            // Aggiungi overlay trasparente per bloccare interazioni
            const overlay = this.scene.add.rectangle(this.scene.cameras.main.centerX, this.scene.cameras.main.centerY, this.scene.cameras.main.width, this.scene.cameras.main.height, 0x000000, 0);
            overlay.setInteractive();
            overlay.setDepth(10);
            // Mostra sconfitta giocatore
            PopupManager.show(I18n.t("playerLose"), 3000, null, null, null, null, 'double', '48px', 'PixelOperator8-Bold', true);
            this.scene.time.delayedCall(6000, () => {
                this.scene.scene.start("MainMenuScene");
            });
        }
    }
}