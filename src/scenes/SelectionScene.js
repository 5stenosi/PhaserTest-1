import { TextButton } from "../game-objects/text-button.js";
import { DashedLine } from "../game-objects/dashed-line.js";
import { I18n } from "../i18n/i18n.js";
import { colors } from "../colors.js";
import { Ship } from "../game-objects/ship.js";
import { PopupManager } from "../game-objects/popup-manager.js";

export default class SelectionScene extends Phaser.Scene {
    constructor() {
        super('SelectionScene');
    }

    create() {

        PopupManager.initialize(this);

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
            this.sound.play('clickSound');
            // Libera la matrice e resetta tutte le navi tramite i loro metodi
            this.ships.forEach(ship => ship.freeGrid(this.occupiedGrid));
            // Anima il ritorno di tutte le navi alla posizione iniziale
            Promise.all(this.ships.map(ship => ship.animateToInitialPosition(this))).then(() => {
                updateResetButtonVisibility();
                // Salva lo stato delle navi dopo il reset
                const shipsPositions = this.ships.map(ship => ship.getState());
                this.registry.set('shipsPositions', shipsPositions);
            });
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
            { width: 1, height: 1, color: colors.tacao, spriteKeyInactive: 'battleship1x1-Inactive', spriteKeyActive: 'battleship1x1-Active' },
            { width: 1, height: 1, color: colors.tacao, spriteKeyInactive: 'battleship1x1-Inactive', spriteKeyActive: 'battleship1x1-Active' },
            { width: 1, height: 1, color: colors.tacao, spriteKeyInactive: 'battleship1x1-Inactive', spriteKeyActive: 'battleship1x1-Active' },
            { width: 1, height: 1, color: colors.tacao, spriteKeyInactive: 'battleship1x1-Inactive', spriteKeyActive: 'battleship1x1-Active' },
            { width: 2, height: 1, color: colors.tacao, spriteKeyInactive: 'battleship2x1-Inactive', spriteKeyActive: 'battleship2x1-Active' },
            { width: 2, height: 1, color: colors.tacao, spriteKeyInactive: 'battleship2x1-Inactive', spriteKeyActive: 'battleship2x1-Active' },
            { width: 2, height: 1, color: colors.tacao, spriteKeyInactive: 'battleship2x1-Inactive', spriteKeyActive: 'battleship2x1-Active' },
            { width: 3, height: 1, color: colors.tacao, spriteKeyInactive: 'battleship3x1-Inactive', spriteKeyActive: 'battleship3x1-Active' },
            { width: 3, height: 1, color: colors.tacao, spriteKeyInactive: 'battleship3x1-Inactive', spriteKeyActive: 'battleship3x1-Active' },
            { width: 4, height: 1, color: colors.tacao, spriteKeyInactive: 'battleship4x1-Inactive', spriteKeyActive: 'battleship4x1-Active' },
        ];
        this.ships = [];
        // Se ci sono dati salvati, ripristina le navi
        const savedShips = this.registry.get('shipsPositions');
        if (Array.isArray(savedShips) && savedShips.length === this.shipsConfig.length) {
            // Va a capo ogni volta che cambia il tipo di nave
            const startX = 50;
            const startY = 120;
            const maxWidth = gridX - 20;
            let currentX = startX;
            let currentY = startY;
            let rowHeight = 0;
            let prevType = null;
            this.shipsConfig.forEach((cfg, idx) => {
                const saved = savedShips[idx];
                const shipWidth = cfg.width * cellSize;
                const shipHeight = cfg.height * cellSize;
                // Va a capo se cambia tipo di nave
                const currType = `${cfg.width}x${cfg.height}`;
                if (prevType !== null && currType !== prevType) {
                    currentX = startX;
                    currentY += rowHeight + 10;
                    rowHeight = 0;
                }
                prevType = currType;
                const ship = new Ship(this, saved.x, saved.y, { ...cfg, cellSize });
                ship.initialX = currentX;
                ship.initialY = currentY;
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
                currentX += shipWidth + 10;
                if (shipHeight > rowHeight) rowHeight = shipHeight;
            });
        } else {
            // Va a capo ogni volta che cambia il tipo di nave
            const startX = 50;
            const startY = 120;
            const maxWidth = gridX - 175;
            let currentX = startX;
            let currentY = startY;
            let rowHeight = 0;
            let prevType = null;
            this.shipsConfig.forEach((cfg, idx) => {
                const shipWidth = cfg.width * cellSize;
                const shipHeight = cfg.height * cellSize;
                const currType = `${cfg.width}x${cfg.height}`;
                if (prevType !== null && currType !== prevType) {
                    currentX = startX;
                    currentY += rowHeight + 10;
                    rowHeight = 0;
                }
                prevType = currType;
                const ship = new Ship(this, currentX, currentY, { ...cfg, cellSize });
                ship.initialX = currentX;
                ship.initialY = currentY;
                ship.isPlaced = false;
                this.ships.push(ship);
                currentX += shipWidth + 10;
                if (shipHeight > rowHeight) rowHeight = shipHeight;
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
            const startCol = Math.round((localX - gridX) / cellSize);
            const startRow = Math.round((localY - gridY) / cellSize);
            // Usa metodi Ship per validazione e occupazione
            if (!gameObject.canPlaceAt(startRow, startCol, this.occupiedGrid)) {
                // Posizione non valida, torna alla posizione iniziale con animazione
                gameObject.animateToInitialPosition(this);
                gameObject.isPlaced = false;
            } else {
                // Libera vecchie celle e occupa le nuove
                gameObject.freeGrid(this.occupiedGrid);
                gameObject.occupyGrid(startRow, startCol, this.occupiedGrid);
                // Snap alla cella più vicina
                gameObject.x = gridX + startCol * cellSize;
                gameObject.y = gridY + startRow * cellSize;
                // Suono di piazzamento nave (non sovrappone lo stesso suono)
                if (this.sound && this.sound.play) {
                    const placeSound = this.sound.add('placeShipSound', {
                        loop: false
                    });
                    placeSound.play();
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
            this.sound.play('clickSound');
            // Salva le posizioni delle navi
            this.registry.set('shipsPositions', this.ships.map(ship => ship.getState()));
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

        this.nextSceneButton.on('buttonclick', () => {
            this.sound.play('clickSound');
            // Controlla se tutte le navi sono posizionate
            const allPlaced = this.ships.every(ship => ship.isPlaced);
            if (!allPlaced) {
                PopupManager.show(
                    I18n.t('placeAllShipsError'),
                    2000,
                    this.cameras.main.centerX,
                    490,
                );
                return;
            }
            this.registry.set('shipsPositions', this.ships.map(ship => ship.getState()));

        });

        this.nextSceneButton.on('pointerdown', () => {
            PopupManager.hide();
        });
    }
}
