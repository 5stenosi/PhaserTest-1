import { TextButton } from "../game-objects/text-button.js";
import { I18n } from "../i18n/i18n.js";
import { colors } from "../colors.js";
import { changelogData } from "../changelog.js";

export default class ChangeLogScene extends Phaser.Scene {
    constructor() {
        super("ChangeLogScene");
    }

    create() {
        this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, "changeLogSceneBackground")
            .setOrigin(0.5)
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height)
            .setDepth(-1);


        // Titolo della scena
        this.titleText = this.add.text(this.cameras.main.centerX, 35, I18n.t("changeLogSceneTitle"), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "48px",
            color: colors.tacao,
        }).setOrigin(0.5, 0).setShadow(-8, 3, colors.matisse, 0);



        // Dimensioni del background e del container visibile
        const bgWidth = this.cameras.main.width;
        const bgHeight = 400;

        // Sfondo del changelog (fisso)
        const background = this.add.graphics();
        background.fillStyle(Phaser.Display.Color.HexStringToColor(colors.tacao).color, 1);
        background.fillRect(this.cameras.main.centerX - bgWidth / 2, 100, bgWidth, bgHeight);

        // Crea il container scrollabile solo per entries e linee
        this.changelogContainer = this.add.container(this.cameras.main.centerX, 100);

        // Maschera per il container (limita la visualizzazione)
        const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(this.cameras.main.centerX - bgWidth / 2, 100, bgWidth, bgHeight);
        const mask = maskShape.createGeometryMask();
        this.changelogContainer.setMask(mask);

        // Linee verticali tratteggiate globali (sul blocco scrollabile)
        const versionColWidth = 180;
        const dateColWidth = 200;
        const featuresWidth = bgWidth - versionColWidth - dateColWidth;
        const dashHeight = 2;
        const gap = 2;
        // Le linee saranno aggiunte DOPO aver calcolato currentY (altezza totale entries)




        // Layout verticale dei changelog con altezza dinamica
        const ENTRY_PADDING = 20;
        let currentY = 0;
        this.entries = [];
        // Ordina le entries per data decrescente, e a parità di data per versione decrescente
        const sortedChangelog = [...changelogData].sort((a, b) => {
            const [da, ma, ya] = a.date.split("-").map(Number);
            const [db, mb, yb] = b.date.split("-").map(Number);
            // YYYYMMDD per confronto
            const numA = ya * 10000 + ma * 100 + da;
            const numB = yb * 10000 + mb * 100 + db;
            if (numB !== numA) {
                return numB - numA;
            }
            // Se la data è uguale, confronta la versione (es: 1.2.0 > 1.1.9)
            const parseVersion = v => v.split('.').map(Number);
            const va = parseVersion(a.version);
            const vb = parseVersion(b.version);
            for (let i = 0; i < Math.max(va.length, vb.length); i++) {
                const na = va[i] || 0;
                const nb = vb[i] || 0;
                if (nb !== na) return nb - na;
            }
            return 0;
        });
        sortedChangelog.forEach((entry, idx) => {
            const entryContainer = this.add.container(0, currentY);

            // Versione (colonna 1)
            const versionText = this.add.text(-bgWidth / 2 + 10, ENTRY_PADDING, entry.version, {
                fontFamily: "PixelOperator8-Bold",
                fontSize: "20px",
                color: colors.matisse,
                align: "left"
            }).setOrigin(0, 0);
            entryContainer.add(versionText);

            // Funzionalità (colonna centrale)
            const featuresString = entry.features.map(f => `• ${I18n.t(f)}`).join("\n");
            const featuresText = this.add.text(-bgWidth / 2 + versionColWidth + 20, ENTRY_PADDING, featuresString, {
                fontFamily: "PixelOperator8",
                fontSize: "16px",
                color: colors.matisse,
                wordWrap: { width: featuresWidth - 20 },
                align: "left",
                lineSpacing: 5
            }).setOrigin(0, 0);
            entryContainer.add(featuresText);

            // Data (colonna 3)
            const dateText = this.add.text(-bgWidth / 2 + versionColWidth + featuresWidth + 20, ENTRY_PADDING, entry.date, {
                fontFamily: "PixelOperator8",
                fontSize: "20px",
                color: colors.matisse,
                align: "left"
            }).setOrigin(0, 0);
            entryContainer.add(dateText);

            this.changelogContainer.add(entryContainer);
            this.entries.push(entryContainer);

            // Calcola l'altezza effettiva occupata dalla entry (prende la più alta tra le colonne)
            const entryHeight = Math.max(versionText.height, featuresText.height, dateText.height);
            const entryMaxHeight = entryHeight + ENTRY_PADDING * 2;

            // Aggiungi linea tratteggiata orizzontale sotto la entry, tranne l'ultima
            if (idx < sortedChangelog.length - 1) {
                const line = this.add.graphics();
                line.lineStyle(2, Phaser.Display.Color.HexStringToColor(colors.matisse).color, 1);
                let dashX = -bgWidth / 2 + 5;
                const dashW = 2;
                const gapW = 2;
                const yLine = entryMaxHeight;
                while (dashX < bgWidth / 2 - 5) {
                    line.beginPath();
                    line.moveTo(dashX, yLine);
                    line.lineTo(Math.min(dashX + dashW, bgWidth / 2 - 5), yLine);
                    line.strokePath();
                    dashX += dashW + gapW;
                }
                entryContainer.add(line);
            }

            currentY += entryMaxHeight;
        });

        // Ora che conosciamo currentY (altezza totale entries), disegniamo le linee tratteggiate verticali sull'intero blocco scrollabile
        // L'altezza minima delle linee verticali deve essere almeno pari all'altezza del container visibile (bgHeight)
        const verticalLineHeight = Math.max(currentY, bgHeight);

        // Prima linea: tra versione e funzionalità
        const line1 = this.add.graphics();
        line1.lineStyle(2, Phaser.Display.Color.HexStringToColor(colors.matisse).color, 1);
        let dashY = 0;
        while (dashY < verticalLineHeight) {
            line1.beginPath();
            // 10px di stacco da sopra e da sotto
            if (dashY + dashHeight <= verticalLineHeight - 10 && dashY >= 10) {
                line1.moveTo(-bgWidth / 2 + versionColWidth, dashY);
                line1.lineTo(-bgWidth / 2 + versionColWidth, Math.min(dashY + dashHeight, verticalLineHeight - 10));
            }
            line1.strokePath();
            dashY += dashHeight + gap;
        }
        this.changelogContainer.addAt(line1, 0);

        // Seconda linea: tra funzionalità e data
        const line2 = this.add.graphics();
        line2.lineStyle(2, Phaser.Display.Color.HexStringToColor(colors.matisse).color, 1);
        dashY = 0;
        while (dashY < verticalLineHeight) {
            line2.beginPath();
            if (dashY + dashHeight <= verticalLineHeight - 10 && dashY >= 10) {
                line2.moveTo(-bgWidth / 2 + versionColWidth + featuresWidth, dashY);
                line2.lineTo(-bgWidth / 2 + versionColWidth + featuresWidth, Math.min(dashY + dashHeight, verticalLineHeight - 10));
            }
            line2.strokePath();
            dashY += dashHeight + gap;
        }
        this.changelogContainer.addAt(line2, 1);

        // Scroll: limiti e variabili
        this.scrollY = 0;
        this.maxScrollY = Math.max(0, currentY - bgHeight);

        // Gestione scroll con rotella del mouse
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (pointer.y > 100 && pointer.y < 100 + bgHeight) { // solo se il mouse è sopra il container
                this.scrollY += deltaY * 0.5; // velocità scroll
                this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
                this.changelogContainer.y = 100 - this.scrollY;
            }
        });

        // Gestione scroll tramite drag
        this.isDragging = false;
        this.dragStartY = 0;
        this.scrollStartY = 0;

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown() && pointer.y > 100 && pointer.y < 100 + bgHeight) {
                this.isDragging = true;
                this.dragStartY = pointer.y;
                this.scrollStartY = this.scrollY;
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                const delta = pointer.y - this.dragStartY;
                this.scrollY = Phaser.Math.Clamp(this.scrollStartY - delta, 0, this.maxScrollY);
                this.changelogContainer.y = 100 - this.scrollY;
            }
        });

        this.input.on('pointerup', () => {
            this.isDragging = false;
        });



        // bottone per tornare al menu principale
        this.backToMenuButton = new TextButton(this, 35, 575, I18n.t("backToMenu").toUpperCase(), {
            fontFamily: "PixelOperator8-Bold",
            fontSize: "28px",
            color: colors.tacao,
            activeColor: colors.matisse,
            backgroundColor: colors.matisse,
            activeBackground: colors.tacao
        }).setOrigin(0, 1);
        this.add.existing(this.backToMenuButton);

        this.backToMenuButton.on('buttonclick', () => {
            this.scene.start('MainMenuScene');
        });
    }

}