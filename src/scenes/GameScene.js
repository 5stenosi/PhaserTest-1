import { TextButton } from "../game-objects/text-button.js";
import { ToggleTextButton } from "../game-objects/toggle-text-button.js";
import { DashedLine } from "../game-objects/dashed-line.js";
import { PopupManager } from "../managers/popup-manager.js";
import { I18n } from "../i18n/i18n.js";
import { colors } from "../colors.js";
import { Ship } from "../game-objects/ship.js";
import { CpuManager } from "../managers/cpu-manager.js";
import { BattleManager } from "../managers/battle-manager.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");
    }

    create() {

        // Dimensioni del background e del container visibile
        const bgWidth = this.cameras.main.width;
        const bgHeight = this.cameras.main.height;


        // Titolo della scena
        this.titleText = this.add.text(this.cameras.main.centerX, 35, I18n.t("gameSceneTitle"), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "32px",
            resolution: 3,
            color: colors.madang,
            wordWrap: { width: this.cameras.main.width - 35 },
        }).setOrigin(0.5, 0);


        // Linea tratteggiata sotto il titolo
        new DashedLine(this, 35, 80, bgWidth - 70, {
            orientation: 'horizontal',
            color: colors.madang,
            thickness: 2,
            dash: 4,
            gap: 2
        });


        // Griglia 10x10 a sinistra
        const gridSize = 10;
        const cellSize = 32;
        const gridWidth = gridSize * cellSize;
        const gridHeight = gridSize * cellSize;
        const gridX = 35;
        const gridY = (this.cameras.main.height - gridHeight) / 2;

        // Salva dimensioni per uso successivo
        this.gridSize = gridSize;
        this.cellSize = cellSize;
        this.gridX = gridX;
        this.gridY = gridY;

        // Sfondo della griglia
        const gridBackground = this.add.graphics().setDepth(-0.5);
        gridBackground.fillStyle(Phaser.Display.Color.HexStringToColor(colors.matisse).color, 1);
        gridBackground.fillRect(gridX, gridY, gridWidth, gridHeight);

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

        // Testo sopra la griglia giocatore
        this.add.text(gridX + gridWidth / 2, gridY - 20, I18n.t("player"), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "16px",
            resolution: 3,
            color: colors.madang,
        }).setOrigin(0.5);

        // Carica e mostra le navi salvate
        const savedShips = this.registry.get('shipsPositions');
        this.playerShips = [];
        this.playerOccupiedGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
        if (savedShips) {
            const oldGridX = this.cameras.main.width - gridWidth - 35;
            const offsetX = gridX - oldGridX;
            savedShips.forEach(shipState => {
                const ship = new Ship(this, shipState.x + offsetX, shipState.y, {
                    width: shipState.width,
                    height: shipState.height,
                    cellSize: cellSize,
                    spriteKeyInactive: shipState.spriteKeyInactive,
                    spriteKeyActive: shipState.spriteKeyActive,
                    dragSound: shipState.dragSound || null
                });
                if (shipState.active) {
                    ship.setActiveState(true);
                }
                this.playerShips.push(ship);
                // Popola playerOccupiedGrid
                const startRow = Math.floor((ship.y - gridY) / cellSize);
                const startCol = Math.floor((ship.x - gridX) / cellSize);
                ship.occupyGrid(startRow, startCol, this.playerOccupiedGrid, gridX, gridY);
            });
        }

        // Griglia 10x10 a destra (vuota)
        const rightGridX = this.cameras.main.width - gridWidth - 35;
        const rightGridY = gridY;

        // Sfondo della griglia destra
        const rightGridBackground = this.add.graphics().setDepth(-0.5);
        rightGridBackground.fillStyle(Phaser.Display.Color.HexStringToColor(colors.matisse).color, 1);
        rightGridBackground.fillRect(rightGridX, rightGridY, gridWidth, gridHeight);

        // Linee orizzontali destra
        for (let i = 0; i <= gridSize; i++) {
            new DashedLine(this, rightGridX, rightGridY + i * cellSize, gridWidth, {
                orientation: 'horizontal',
                color: 'tacao',
                thickness: 2,
                dash: 8,
                gap: 4
            });
        }
        // Linee verticali destra
        for (let i = 0; i <= gridSize; i++) {
            new DashedLine(this, rightGridX + i * cellSize, rightGridY, gridHeight, {
                orientation: 'vertical',
                color: 'tacao',
                thickness: 2,
                dash: 8,
                gap: 4
            });
        }

        // Testo sopra la griglia CPU
        this.add.text(rightGridX + gridWidth / 2, rightGridY - 20, I18n.t("cpu"), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "16px",
            resolution: 3,
            color: colors.madang,
        }).setOrigin(0.5);

        // Matrice per celle occupate della CPU (10x10)
        this.cpuOccupiedGrid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));

        // Crea il manager CPU
        this.cpuManager = new CpuManager(this, gridSize, cellSize, rightGridX, rightGridY, this.cpuOccupiedGrid, false);

        // Piazza le navi CPU
        this.cpuManager.placeShips();

        // Crea il battle manager
        this.battleManager = new BattleManager(this, gridSize, cellSize, gridX, gridY, rightGridX, rightGridY, this.playerOccupiedGrid, this.cpuOccupiedGrid, this.cpuManager);

        // Inizializza il popup manager
        PopupManager.initialize(this);

        this.speedMultiplier = 1;


        // Linea tratteggiata sopra i bottoni
        new DashedLine(this, 35, 520, bgWidth - 70, {
            orientation: 'horizontal',
            color: colors.madang,
            thickness: 2,
            dash: 4,
            gap: 2
        });


        this.quitButton = new TextButton(this, 35, 575, I18n.t("quitGame").toUpperCase(), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "16px",
            color: colors.madang,
            activeColor: colors.matisse,
            backgroundColor: colors.matisse,
            activeBackground: colors.madang
        }).setOrigin(0, 1);
        this.add.existing(this.quitButton);

        this.quitButton.on('buttonclick', () => {
            this.sound.play('clickSound');
            this.scene.start('SelectionScene');
        });

        // Container per i bottoni AUTO e 2x
        const buttonContainer = this.add.container(bgWidth - 35, 575);

        // Pulsante 2x (creato prima per calcolare la larghezza)
        this.twoXButton = new ToggleTextButton(this, 0, 0, "2x", {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "16px",
            color: colors.tacao,
            backgroundColor: colors.matisse,
            activeColor: colors.matisse,
            activeBackground: colors.tacao,
            toggledColor: colors.matisse,
            toggledBackground: colors.tacao,
            disabledColor: colors.madang,
            disabledBackground: colors.matisse
        }).setOrigin(1, 1);
        buttonContainer.add(this.twoXButton);

        // Calcola la larghezza del pulsante 2x
        const twoXWidth = this.twoXButton.width;

        // Pulsante AUTO (posizionato a sinistra del 2x)
        this.autoButton = new ToggleTextButton(this, -twoXWidth, 0, "AUTO", {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "16px",
            color: colors.tacao,
            activeColor: colors.matisse,
            backgroundColor: colors.matisse,
            activeBackground: colors.tacao,
            toggledColor: colors.matisse,
            toggledBackground: colors.tacao
        }).setOrigin(1, 1);
        buttonContainer.add(this.autoButton);

        this.autoButton.on('buttonclick', () => {
            this.sound.play('clickSound');
            this.autoButton.toggle();
            this.isAutoMode = this.autoButton.isToggled;
            this.battleManager.setAutoMode(this.isAutoMode);
            // Gestisci il bottone 2x
            if (!this.isAutoMode) {
                this.twoXButton.setDisabled(true);
                this.twoXButton.isToggled = false;
                this.speedMultiplier = 1;
                this.battleManager.setSpeedMode(false);
            } else {
                this.twoXButton.setDisabled(false);
            }
        });

        // Inizialmente disabilitato
        this.twoXButton.setDisabled(true);

        this.twoXButton.on('buttonclick', () => {
            if (this.twoXButton.isDisabled) {
                this.errorSound.play();
                PopupManager.show(
                    I18n.t("TwoXError"),
                    2000,
                    this.cameras.main.centerX,
                    490,
                    null, null, null, null, null);
                return;
            }
            this.sound.play('clickSound');
            this.twoXButton.toggle();
            this.speedMultiplier = this.twoXButton.isToggled ? 0.5 : 1;
            this.battleManager.setSpeedMode(this.twoXButton.isToggled);
        });

        this.twoXButton.on('pointerdown', () => {
            PopupManager.hide();
        });

        this.changeTurn1Sound = this.sound.add('changeTurn1Sound', { volume: 0.4 });
        this.changeTurn2Sound = this.sound.add('changeTurn2Sound', { volume: 0.4 });
        this.errorSound = this.sound.add('errorSound');

        // Freccia al centro
        this.turnArrow = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'turnArrow');

        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, I18n.t("turn"), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "16px",
            resolution: 3,
            color: colors.matisse,
        }).setOrigin(0.5);
    }

    handleTurnArrowClick() {
        this.turnArrow.setAlpha(0);
        this.changeTurn1Sound.play();
        this.time.delayedCall(1000 * this.speedMultiplier, () => {
            this.changeTurn2Sound.play();
            this.turnArrow.scaleX *= -1; // Flip orizzontale
            this.turnArrow.setAlpha(1);
        });
    }
}
