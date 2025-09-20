import { TextButton } from "../game-objects/text-button.js";
import { DashedLine } from "../game-objects/dashed-line.js";
import { ImageButton } from "../game-objects/image-button.js";
import { PopupManager } from "../managers/popup-manager.js";
import { I18n } from "../i18n/i18n.js";
import { colors } from "../colors.js";
import { Ship } from "../game-objects/ship.js";
import { DragDropManager } from "../managers/drag-drop-manager.js";
import { shipsConfig } from "../config/ship-config.js";
import { ShipManager } from "../managers/ship-manager.js";

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
            color: colors.madang,
        }).setOrigin(0.5, 0);

        // Linea tratteggiata sotto il titolo
        new DashedLine(this, 35, 80, bgWidth - 70, {
            orientation: 'horizontal',
            color: colors.madang,
            thickness: 2,
            dash: 4,
            gap: 2
        });


        this.placeRandomButton = new ImageButton(
            this,
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'rightArrowInactive',
            'rightArrowActive',
        ).setOrigin(0.5);
        this.add.existing(this.placeRandomButton
        );

        const placeSound = this.sound.add('placeShipSound', {
            volume: 0.2,
            loop: false
        });

        const cargoShipSound = this.sound.add('cargoShipSound', {
            volume: 0.5,
            loop: false
        });

        const gondolaShipSound = this.sound.add('gondolaShipSound', {
            volume: 0.5,
            loop: false
        });

        const inflatableShipSound = this.sound.add('inflatableShipSound', {
            volume: 0.5,
            loop: false
        });

        const raftShipSound = this.sound.add('raftShipSound', {
            volume: 0.5,
            loop: false
        });

        this.placeRandomButton.on('buttonclick', () => {
            this.sound.play('clickSound');
            placeSound.play();

            const gridSize = 10;
            const cellSize = 32;
            const gridX = bgWidth - gridSize * cellSize - 35;
            const gridY = (bgHeight - gridSize * cellSize) / 2;

            // Svuota prima la griglia dalle navi non piazzate
            this.ships.forEach(ship => {
                if (!ship.isPlaced) {
                    ship.freeGrid(this.occupiedGrid);
                }
            });

            // Piazza tutte le navi non piazzate, ordinandole per dimensione decrescente
            const shipsToPlace = this.ships.filter(ship => !ship.isPlaced).sort((a, b) => (b.widthCells * b.heightCells) - (a.widthCells * a.heightCells));
            shipsToPlace.forEach(ship => {
                let placed = false;
                let attempts = 0;

                while (!placed && attempts < 1000) { // limite tentativi aumentato
                    const startRow = Phaser.Math.Between(0, gridSize - ship.heightCells);
                    const startCol = Phaser.Math.Between(0, gridSize - ship.widthCells);

                    if (ship.canPlaceAt(startRow, startCol, this.occupiedGrid)) {
                        ship.occupyGrid(startRow, startCol, this.occupiedGrid, gridX, gridY);
                        ship.x = gridX + startCol * cellSize;
                        ship.y = gridY + startRow * cellSize;
                        placed = true;
                    }

                    attempts++;
                }

                ship.animateToPosition(this, ship.initialX, ship.initialY, ship.x, ship.y);
            });

            // Mostra le celle adiacenti
            this.ships.forEach(ship => {
                if (ship.isPlaced) ship.showAdjacentCells(250);
            });

            // Aggiorna visibilità pulsante reset
            updateResetButtonVisibility();

            // Salva stato
            const shipsPositions = this.shipManager.saveShips();
            this.registry.set('shipsPositions', shipsPositions);
        });

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
                color: colors.madang,
                activeColor: colors.matisse,
                backgroundColor: "rgba(0,0,0,0)",
                activeBackground: colors.madang
            }
        ).setOrigin(0.5);
        this.add.existing(this.resetShipsButton);
        this.resetShipsButton.setVisible(false);

        const updateResetButtonVisibility = () => {
            this.shipManager.updateResetButtonVisibility((visible) => this.resetShipsButton.setVisible(visible));
        };

        this.resetShipsButton.on('buttonclick', () => {
            this.sound.play('clickSound');
            this.shipManager.resetShips(() => {
                updateResetButtonVisibility();
                if (this.saveState) {
                    const shipsPositions = this.shipManager.saveShips();
                    this.registry.set('shipsPositions', shipsPositions);
                }
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
                color: 'madang',
                thickness: 2,
                dash: 8,
                gap: 4
            });
        }
        // Linee verticali
        for (let i = 0; i <= gridSize; i++) {
            new DashedLine(this, gridX + i * cellSize, gridY, gridHeight, {
                orientation: 'vertical',
                color: 'madang',
                thickness: 2,
                dash: 8,
                gap: 4
            });
        }

        // Matrice per celle occupate (10x10)
        this.occupiedGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

        const savedShips = this.registry.get('shipsPositions');
        this.shipManager = new ShipManager(this, gridSize, cellSize, gridX, gridY, this.occupiedGrid, shipsConfig);
        this.shipManager.createShips(savedShips);
        this.ships = this.shipManager.getShips();

        // Aggiorna la visibilità del reset dopo aver creato le navi
        updateResetButtonVisibility();

        // Inizializza DragDropManager
        new DragDropManager(this, this.occupiedGrid, gridX, gridY, cellSize, this.ships, placeSound, updateResetButtonVisibility);


        // Linea tratteggiata sopra i bottoni
        new DashedLine(this, 35, 520, bgWidth - 70, {
            orientation: 'horizontal',
            color: colors.madang,
            thickness: 2,
            dash: 4,
            gap: 2
        });

        // bottone per tornare al menu principale
        this.backToMenuButton = new TextButton(this, 35, 575, I18n.t("backToMenu").toUpperCase(), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "16px",
            color: colors.madang,
            activeColor: colors.matisse,
            backgroundColor: "rgba(0,0,0,0)",
            activeBackground: colors.madang
        }).setOrigin(0, 1);
        this.add.existing(this.backToMenuButton);

        this.backToMenuButton.on('buttonclick', () => {
            this.sound.play('clickSound');
            // Salva le posizioni delle navi
            this.registry.set('shipsPositions', this.shipManager.saveShips());
            this.scene.start('MainMenuScene');
        });

        this.nextSceneButton = new TextButton(this, 865, 575, I18n.t('next').toUpperCase(), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "16px",
            color: colors.madang,
            activeColor: colors.matisse,
            backgroundColor: "rgba(0,0,0,0)",
            activeBackground: colors.madang
        }).setOrigin(1, 1);
        this.add.existing(this.nextSceneButton);

        this.nextSceneButton.on('buttonclick', () => {
            // Controlla se tutte le navi sono posizionate
            const allPlaced = this.ships.every(ship => ship.isPlaced);
            if (!allPlaced) {
                PopupManager.show(
                    I18n.t('placeAllShipsError'),
                    2000,
                    this.cameras.main.centerX,
                    490,
                    null, null, null, null, null
                );
                this.sound.play('errorSound');
                return;
            }
            this.sound.play('clickSound');

            this.registry.set('shipsPositions', this.shipManager.saveShips());

            this.scene.start('GameScene');
        });

        this.nextSceneButton.on('pointerdown', () => {
            PopupManager.hide();
        });
    }
}
