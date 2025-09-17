/**
 * Esempio:
 *   new DashedLine(scene, x, y, length, {
 *     orientation: 'vertical',
 *     color: 0x000000,
 *     thickness: 2,
 *     dash: 4,
 *     gap: 2
 *   });
 */
import { colors } from "../colors.js";

export class DashedLine extends Phaser.GameObjects.Graphics {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x - coordinata x di partenza
     * @param {number} y - coordinata y di partenza
     * @param {number} length - lunghezza totale della linea
     * @param {object} [options]
     * @param {'horizontal'|'vertical'} [options.orientation] - orientamento ('horizontal' o 'vertical'), default 'horizontal'
     * @param {number} [options.color] - colore (esadecimale), default 0xff0000
     * @param {number} [options.thickness] - spessore linea, default 2
     * @param {number} [options.dash] - lunghezza tratto, default 2
     * @param {number} [options.gap] - lunghezza gap, default 2
     */
    constructor(scene, x, y, length, options = {}) {
        super(scene);
        this.x = x;
        this.y = y;
        const orientation = options.orientation || 'horizontal';
        let color = options.color !== undefined ? options.color : 0xff0000;
        // Permetti stringhe (es. 'matisse', '#226594') o numeri
        if (typeof color === 'string') {
            // Se è un nome presente in colors.js, usa il valore
            if (colors[color]) {
                color = colors[color];
            }
            // Se è una stringa esadecimale (#...), converti in numero
            if (typeof color === 'string' && color.startsWith('#')) {
                color = parseInt(color.replace('#', '0x'));
            }
        }
        const thickness = options.thickness !== undefined ? options.thickness : 2;
        const dash = options.dash !== undefined ? options.dash : 2;
        const gap = options.gap !== undefined ? options.gap : 2;

        this.lineStyle(thickness, color, 1);
        let drawn = 0;
        while (drawn < length) {
            const seg = Math.min(dash, length - drawn);
            if (orientation === 'vertical') {
                this.beginPath();
                this.moveTo(0, drawn);
                this.lineTo(0, drawn + seg);
                this.strokePath();
            } else {
                this.beginPath();
                this.moveTo(drawn, 0);
                this.lineTo(drawn + seg, 0);
                this.strokePath();
            }
            drawn += seg + gap;
        }
        scene.add.existing(this);
    }
}
