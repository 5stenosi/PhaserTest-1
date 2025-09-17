import { TextButton } from "../game-objects/text-button.js";
import { DashedLine } from "../game-objects/dashed-line.js";
import { I18n } from "../i18n/i18n.js";
import { colors } from "../colors.js";
import { Ship } from "../game-objects/ship.js";

export default class SelectionScene extends Phaser.Scene {
    constructor() {
        super('SelectionScene');
    }

    create() {
        // Dimensioni del background e del container visibile
        const bgWidth = this.cameras.main.width;
        const bgHeight = this.cameras.main.height;

        // Sfondo del rettangolo
        const background = this.add.graphics().setDepth(-1);
        background.fillStyle(Phaser.Display.Color.HexStringToColor(colors.matisse).color, 1);
        background.fillRect(this.cameras.main.centerX - bgWidth / 2, 0, bgWidth, bgHeight);


        // Titolo della scena
        this.titleText = this.add.text(this.cameras.main.centerX, 35, I18n.t("selectionSceneTitle"), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "32px",
            resolution: 3,
            color: colors.tacao,
            wordWrap: { width: this.cameras.main.width - 35 },
        }).setOrigin(0.5, 0);

        // Linea tratteggiata sotto il titolo
        new DashedLine(this, 35, 80, bgWidth - 70, {
            orientation: 'horizontal',
            color: colors.tacao,
            thickness: 2,
            dash: 4,
            gap: 2
        });


        // Freccia al centro della scena
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "rightArrow").setOrigin(0.5);

        // Pulsante reset navi sotto la freccia (TextButton)
        const resetButtonY = this.cameras.main.centerY + 110;
        this.resetShipsButton = new TextButton(
            this,
            this.cameras.main.centerX,
            resetButtonY,
            'RESET',
            {
                fontFamily: "PixelOperator8-Bold",
                fontSize: "18px",
                color: colors.tacao,
                activeColor: colors.matisse,
                backgroundColor: "rgba(0,0,0,0)",
                activeBackground: colors.tacao
            }
        ).setOrigin(0.5);
        this.add.existing(this.resetShipsButton);
        this.resetShipsButton.setVisible(false);

        const updateResetButtonVisibility = () => {
            // Mostra il reset solo se almeno una nave è nella griglia
            const anyPlaced = this.ships.some(ship => ship.isPlaced);
            this.resetShipsButton.setVisible(anyPlaced);
        };

        this.resetShipsButton.on('buttonclick', () => {
            // Libera la matrice
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    this.occupiedGrid[r][c] = null;
                }
            }
            // Riposiziona tutte le navi e resetta la rotazione
            this.ships.forEach((ship, idx) => {
                if (typeof ship.initialX === 'number' && typeof ship.initialY === 'number') {
                    ship.x = ship.initialX;
                    ship.y = ship.initialY;
                }
                ship.isPlaced = false;
            });
            updateResetButtonVisibility();
            // Salva lo stato delle navi dopo il reset
            const shipsPositions = this.ships.map(ship => ({
                x: ship.x,
                y: ship.y,
                width: ship.widthCells,
                height: ship.heightCells,
                spriteKey: ship.spriteKey || null
            }));
            this.registry.set('shipsPositions', shipsPositions);
        });

        // Griglia 10x10 a destra
        const gridSize = 10;
        const cellSize = 32;
        const gridWidth = gridSize * cellSize;
        const gridHeight = gridSize * cellSize;
        const gridX = bgWidth - gridWidth - 35;
        const gridY = (bgHeight - gridHeight) / 2;

        // Linee orizzontali
        for (let i = 0; i <= gridSize; i++) {
            new DashedLine(this, gridX, gridY + i * cellSize, gridWidth, {
                orientation: 'horizontal',
                color: 'tacao',
                thickness: 2,
                dash: 8,
                gap: 4
            });
        }
        // Linee verticali
        for (let i = 0; i <= gridSize; i++) {
            new DashedLine(this, gridX + i * cellSize, gridY, gridHeight, {
                orientation: 'vertical',
                color: 'tacao',
                thickness: 2,
                dash: 8,
                gap: 4
            });
        }

        // --- NAVI DRAGGABILI ---
        // Matrice per celle occupate (10x10)
        this.occupiedGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
        // Definizione delle navi disponibili (facilmente estendibile)
        this.shipsConfig = [
            { width: 1, height: 1, color: colors.tacao, spriteKey: 'battleship1x1' },
            { width: 2, height: 1, color: colors.tacao, spriteKey: 'battleship2x1' },
            { width: 3, height: 1, color: colors.tacao, spriteKey: 'battleship3x1' },
            { width: 4, height: 1, color: colors.tacao, spriteKey: 'battleship4x1' },
        ];
        this.ships = [];
        // Se ci sono dati salvati, ripristina le navi
        const savedShips = this.registry.get('shipsPositions');
        if (Array.isArray(savedShips) && savedShips.length === this.shipsConfig.length) {
            this.shipsConfig.forEach((cfg, idx) => {
                const saved = savedShips[idx];
                const ship = new Ship(this, saved.x, saved.y, { ...cfg, cellSize });
                ship.initialX = 50;
                ship.initialY = 120 + idx * 50;
                // Considera la nave "piazzata" se è nella griglia
                if (
                    saved.x >= gridX &&
                    saved.x + (cfg.width * cellSize) <= gridX + gridWidth &&
                    saved.y >= gridY &&
                    saved.y + (cfg.height * cellSize) <= gridY + gridHeight
                ) {
                    ship.isPlaced = true;
                } else {
                    ship.isPlaced = false;
                }
                this.ships.push(ship);
            });
        } else {
            // Posiziona le navi a sinistra della griglia
            this.shipsConfig.forEach((cfg, idx) => {
                const startX = 50;
                const startY = 120 + idx * 50;
                const ship = new Ship(this, startX, startY, { ...cfg, cellSize });
                ship.initialX = startX;
                ship.initialY = startY;
                ship.isPlaced = false;
                this.ships.push(ship);
            });
        }
        // Aggiorna la visibilità del reset dopo aver creato le navi
        updateResetButtonVisibility();

        // Drag & drop logica
        let draggingShip = null;
        this.input.on('dragstart', (pointer, gameObject) => {
            gameObject.setAlpha(0.7);
            this.children.bringToTop(gameObject);
            draggingShip = gameObject;
        });
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });
        this.input.on('dragend', (pointer, gameObject) => {
            gameObject.setAlpha(1);
            draggingShip = null;
            // Snap alla griglia se vicino
            const localX = gameObject.x;
            const localY = gameObject.y;
            // Usa Math.round per migliorare la precisione dello snap
            const startCol = Math.round((localX - gridX) / cellSize);
            const startRow = Math.round((localY - gridY) / cellSize);
            const widthCells = gameObject.widthCells || 1;
            const heightCells = gameObject.heightCells || 1;
            let earlyReturn = false;
            // Nuovi limiti: permetti il piazzamento esatto al bordo
            if (
                startCol < 0 ||
                startRow < 0 ||
                startCol + widthCells > gridSize ||
                startRow + heightCells > gridSize
            ) {
                // Torna alla posizione di partenza assoluta
                if (typeof gameObject.initialX === 'number' && typeof gameObject.initialY === 'number') {
                    gameObject.x = gameObject.initialX;
                    gameObject.y = gameObject.initialY;
                } else {
                    gameObject.x = gameObject.input.dragStartX;
                    gameObject.y = gameObject.input.dragStartY;
                }
                gameObject.isPlaced = false;
                earlyReturn = true;
            } else {
                // Controlla sovrapposizione
                let overlap = false;
                for (let ix = 0; ix < widthCells; ix++) {
                    for (let iy = 0; iy < heightCells; iy++) {
                        if (this.occupiedGrid[startRow + iy][startCol + ix] && this.occupiedGrid[startRow + iy][startCol + ix] !== gameObject) {
                            overlap = true;
                        }
                    }
                }
                if (overlap) {
                    // Torna alla posizione iniziale
                    gameObject.x = gameObject.input.dragStartX;
                    gameObject.y = gameObject.input.dragStartY;
                    gameObject.isPlaced = false;
                    earlyReturn = true;
                } else {
                    // Libera le vecchie celle occupate da questa nave
                    for (let r = 0; r < gridSize; r++) {
                        for (let c = 0; c < gridSize; c++) {
                            if (this.occupiedGrid[r][c] === gameObject) {
                                this.occupiedGrid[r][c] = null;
                            }
                        }
                    }
                    // Segna le nuove celle occupate
                    for (let ix = 0; ix < widthCells; ix++) {
                        for (let iy = 0; iy < heightCells; iy++) {
                            this.occupiedGrid[startRow + iy][startCol + ix] = gameObject;
                        }
                    }
                    // Snap alla cella più vicina
                    const snappedX = gridX + startCol * cellSize;
                    const snappedY = gridY + startRow * cellSize;
                    gameObject.x = snappedX;
                    gameObject.y = snappedY;
                    gameObject.isPlaced = true;
                }
            }
            updateResetButtonVisibility();
        });


        // Linea tratteggiata sopra i bottoni
        new DashedLine(this, 35, 520, bgWidth - 70, {
            orientation: 'horizontal',
            color: colors.tacao,
            thickness: 2,
            dash: 4,
            gap: 2
        });

        // bottone per tornare al menu principale
        this.backToMenuButton = new TextButton(this, 35, 575, I18n.t("backToMenu").toUpperCase(), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "16px",
            color: colors.tacao,
            activeColor: colors.matisse,
            backgroundColor: "rgba(0,0,0,0)",
            activeBackground: colors.tacao
        }).setOrigin(0, 1);
        this.add.existing(this.backToMenuButton);

        this.backToMenuButton.on('buttonclick', () => {
            // Salva le posizioni delle navi
            this.registry.set('shipsPositions', this.ships.map(ship => ({
                x: ship.x,
                y: ship.y,
                width: ship.widthCells,
                height: ship.heightCells,
                spriteKey: ship.spriteKey || null
            })));
            this.scene.start('MainMenuScene');
        });

        this.nextSceneButton = new TextButton(this, 865, 575, I18n.t('next').toUpperCase(), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "16px",
            color: colors.tacao,
            activeColor: colors.matisse,
            backgroundColor: "rgba(0,0,0,0)",
            activeBackground: colors.tacao
        }).setOrigin(1, 1);
        this.add.existing(this.nextSceneButton);
        // Salva le posizioni anche quando si va avanti
        this.nextSceneButton.on('buttonclick', () => {
            this.registry.set('shipsPositions', this.ships.map(ship => ({
                x: ship.x,
                y: ship.y,
                width: ship.widthCells,
                height: ship.heightCells,
                spriteKey: ship.spriteKey || null
            })));
        });
    }
}