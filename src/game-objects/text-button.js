export class TextButton extends Phaser.GameObjects.Text {
    constructor(scene, x, y, text, style) {
        style = { resolution: 3, ...style };
        
        super(scene, x, y, text, style);

        this._isPointerDown = false;

        // Listener globale per pointerup sulla scena
        scene.input.on('pointerup', () => {
            this._isPointerDown = false;
        });

        this._activeColor = style.activeColor || '#ff0000';
        this._inactiveColor = style.color || '#ff0000';
        this._activeBackground = style.activeBackground || '#ff0000';
        this._inactiveBackground = style.backgroundColor || '#ff0000';


        this.setInteractive()
            .setPadding(16, 10)
            .on('pointerdown', (pointer, localX, localY, event) => {
                this._isPointerDown = true;
                this.enterButtonActiveState();
            })
            .on('pointerup', (pointer, localX, localY, event) => {
                if (this._isPointerDown) {
                    this.emit('buttonclick', pointer, localX, localY, event);
                }
                this._isPointerDown = false;
                this.enterButtonInactiveState();
            })
            .on('pointerout', () => {
                this.enterButtonInactiveState();
            })
            .on('pointerover', () => {
                if (this._isPointerDown) {
                    this.enterButtonActiveState();
                }
            });

        // Listener globale per pointerup sulla scena
        scene.input.on('pointerup', () => {
            this._isPointerDown = false;
            this.enterButtonInactiveState();
        });

    }

    enterButtonActiveState() {
        this.setStyle({
            fill: this._activeColor,
            backgroundColor: this._activeBackground
        });
    }

    enterButtonInactiveState() {
        this.setStyle({
            fill: this._inactiveColor,
            backgroundColor: this._inactiveBackground
        });
    }
}