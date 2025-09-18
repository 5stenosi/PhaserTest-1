export class DragDropManager {
    constructor(scene, occupiedGrid, gridX, gridY, cellSize, ships, placeSound, updateResetButtonVisibilityCallback) {
        this.scene = scene;
        this.occupiedGrid = occupiedGrid;
        this.gridX = gridX;
        this.gridY = gridY;
        this.cellSize = cellSize;
        this.ships = ships;
        this.placeSound = placeSound;
        this.updateResetButtonVisibility = updateResetButtonVisibilityCallback;
        this.draggingShip = null;

        this.setupDragEvents();
    }

    setupDragEvents() {
        this.scene.input.on('dragstart', (pointer, gameObject) => {
            gameObject.setAlpha(0.7);
            this.scene.children.bringToTop(gameObject);
            this.draggingShip = gameObject;

            // Libera le celle occupate dalla nave selezionata
            gameObject.freeGrid(this.occupiedGrid);
        });

        this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            // Calcola la posizione della nave rispetto alla griglia
            const localX = dragX;
            const localY = dragY;
            const startCol = Math.round((localX - this.gridX) / this.cellSize);
            const startRow = Math.round((localY - this.gridY) / this.cellSize);

            // Verifica se la nave può essere posizionata nella nuova posizione
            if (gameObject.canPlaceAt(startRow, startCol, this.occupiedGrid)) {
                // Snap alla cella più vicina
                gameObject.x = this.gridX + startCol * this.cellSize;
                gameObject.y = this.gridY + startRow * this.cellSize;
                gameObject.setAlpha(1); // Mostra la nave normalmente
            } else {
                // Posizione non valida, mostra la nave con trasparenza
                gameObject.x = dragX;
                gameObject.y = dragY;
                gameObject.setAlpha(0.5);
            }
        });

        this.scene.input.on('dragend', (pointer, gameObject) => {
            gameObject.setAlpha(1);
            this.draggingShip = null;
            // Snap alla griglia se vicino
            const localX = gameObject.x;
            const localY = gameObject.y;
            const startCol = Math.round((localX - this.gridX) / this.cellSize);
            const startRow = Math.round((localY - this.gridY) / this.cellSize);
            // Usa metodi Ship per validazione e occupazione
            if (!gameObject.canPlaceAt(startRow, startCol, this.occupiedGrid)) {
                // Posizione non valida, torna alla posizione iniziale con animazione
                gameObject.animateToPosition(this.scene, gameObject.x, gameObject.y, gameObject.initialX, gameObject.initialY);
                gameObject.isPlaced = false;
            } else {
                // Libera vecchie celle e occupa le nuove
                gameObject.freeGrid(this.occupiedGrid);
                gameObject.occupyGrid(startRow, startCol, this.occupiedGrid, this.gridX, this.gridY); // Passa gridX e gridY
                // Snap alla cella più vicina
                gameObject.x = this.gridX + startCol * this.cellSize;
                gameObject.y = this.gridY + startRow * this.cellSize;
                gameObject.showAdjacentCells(0);
                // Suono di piazzamento nave (non sovrappone lo stesso suono)
                if (this.placeSound) {
                    this.placeSound.play();
                }
            }
            if (this.updateResetButtonVisibility) {
                this.updateResetButtonVisibility();
            }
        });
    }

    destroy() {
        // Rimuovi gli event listeners se necessario
        this.scene.input.off('dragstart');
        this.scene.input.off('drag');
        this.scene.input.off('dragend');
    }
}