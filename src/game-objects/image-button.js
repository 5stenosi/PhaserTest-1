

export class ImageButton extends Phaser.GameObjects.Image {
    constructor(scene, x, y, textureInactive, textureActive, hitArea) {
        super(scene, x, y, textureInactive);
        this.textureInactive = textureInactive;
        this.textureActive = textureActive;

        this._isPointerDown = false;

        // Default: rettangolo
        let interactiveConfig = undefined;
        this.setOrigin(0.5, 0.5);
        if (hitArea && hitArea.type === 'circle') {
            // Area circolare centrata sull'immagine
            // NOTA: width/height sono disponibili solo dopo che la texture è stata caricata
            this.once('texturekeychange', () => {
                const r = hitArea.radius || Math.max(this.width, this.height) / 2;
                const circle = new Phaser.Geom.Circle(this.width / 2, this.height / 2, r);
                this.setInteractive(circle, Phaser.Geom.Circle.Contains);
            });
            // Se la texture è già caricata
            if (this.width && this.height) {
                const r = hitArea.radius || Math.max(this.width, this.height) / 2;
                const circle = new Phaser.Geom.Circle(this.width / 2, this.height / 2, r);
                this.setInteractive(circle, Phaser.Geom.Circle.Contains);
            }
        } else {
            this.setInteractive();
        }

        // Incapsula la logica di button down/up
        this.on('pointerdown', (pointer, localX, localY, event) => {
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
        this.setTexture(this.textureActive);
    }

    enterButtonInactiveState() {
        this.setTexture(this.textureInactive);
    }
}
