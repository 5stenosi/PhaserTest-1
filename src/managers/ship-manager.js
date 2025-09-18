import { Ship } from "../game-objects/ship.js";

export class ShipManager {
    constructor(scene, gridSize, cellSize, gridX, gridY, occupiedGrid, shipsConfig) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.gridX = gridX;
        this.gridY = gridY;
        this.occupiedGrid = occupiedGrid;
        this.shipsConfig = shipsConfig;
        this.ships = [];
    }

    createShips(savedShips) {
        if (Array.isArray(savedShips) && savedShips.length === this.shipsConfig.length) {
            this._createShipsFromSaved(savedShips);
        } else {
            this._createShipsNew();
        }
    }

    _createShipsFromSaved(savedShips) {
        // Va a capo ogni volta che cambia il tipo di nave
        const startX = 50;
        const startY = 120;
        const maxWidth = this.gridX - 20;
        let currentX = startX;
        let currentY = startY;
        let rowHeight = 0;
        let prevType = null;
        this.shipsConfig.forEach((cfg, idx) => {
            const saved = savedShips[idx];
            const shipWidth = cfg.width * this.cellSize;
            const shipHeight = cfg.height * this.cellSize;
            // Va a capo se cambia tipo di nave
            const currType = `${cfg.width}x${cfg.height}`;
            if (prevType !== null && currType !== prevType) {
                currentX = startX;
                currentY += rowHeight + 10;
                rowHeight = 0;
            }
            prevType = currType;
            const ship = new Ship(this.scene, saved.x, saved.y, { ...cfg, cellSize: this.cellSize, adjacentCells: saved.adjacentCells || [] });
            ship.initialX = currentX;
            ship.initialY = currentY;
            // Considera la nave "piazzata" se è nella griglia
            if (
                saved.x >= this.gridX &&
                saved.x + (cfg.width * this.cellSize) <= this.gridX + this.gridSize * this.cellSize &&
                saved.y >= this.gridY &&
                saved.y + (cfg.height * this.cellSize) <= this.gridY + this.gridSize * this.cellSize
            ) {
                ship.isPlaced = true;
                const startCol = Math.round((saved.x - this.gridX) / this.cellSize);
                const startRow = Math.round((saved.y - this.gridY) / this.cellSize);
                ship.occupyGrid(startRow, startCol, this.occupiedGrid, this.gridX, this.gridY);
                ship.showAdjacentCells(0);
            } else {
                ship.isPlaced = false;
            }
            this.ships.push(ship);
            currentX += shipWidth + 10;
            if (shipHeight > rowHeight) rowHeight = shipHeight;
        });
    }

    _createShipsNew() {
        // Va a capo ogni volta che cambia il tipo di nave
        const startX = 50;
        const startY = 120;
        const maxWidth = this.gridX - 175;
        let currentX = startX;
        let currentY = startY;
        let rowHeight = 0;
        let prevType = null;
        this.shipsConfig.forEach((cfg, idx) => {
            const shipWidth = cfg.width * this.cellSize;
            const shipHeight = cfg.height * this.cellSize;
            const currType = `${cfg.width}x${cfg.height}`;
            if (prevType !== null && currType !== prevType) {
                currentX = startX;
                currentY += rowHeight + 10;
                rowHeight = 0;
            }
            prevType = currType;
            const ship = new Ship(this.scene, currentX, currentY, { ...cfg, cellSize: this.cellSize });
            ship.initialX = currentX;
            ship.initialY = currentY;
            ship.isPlaced = false;
            this.ships.push(ship);
            currentX += shipWidth + 10;
            if (shipHeight > rowHeight) rowHeight = shipHeight;
        });
    }

    getShips() {
        return this.ships;
    }

    updateResetButtonVisibility(callback) {
        const anyPlaced = this.ships.some(ship => ship.isPlaced);
        callback(anyPlaced);
    }

    saveShips() {
        return this.ships.map(ship => ship.getState());
    }

    resetShips(callback) {
        // Libera la matrice e resetta tutte le navi tramite i loro metodi
        this.ships.forEach(ship => ship.freeGrid(this.occupiedGrid));
        // Anima il ritorno di tutte le navi alla posizione iniziale
        Promise.all(this.ships.map(ship => ship.animateToPosition(this.scene, ship.x, ship.y, ship.initialX, ship.initialY))).then(() => {
            callback();
        });
    }
}