import { TextButton } from "./text-button.js";
import { colors } from "../colors.js";

export class ToggleTextButton extends TextButton {
    constructor(scene, x, y, text, style) {
        super(scene, x, y, text, style);

        this.isToggled = false;
        this.isDisabled = false;
        this._toggledColor = style.toggledColor || colors.matisse;
        this._toggledBackground = style.toggledBackground || colors.madang;
        this._untoggledColor = style.color || colors.madang;
        this._untoggledBackground = style.backgroundColor || colors.matisse;
        this._disabledColor = style.disabledColor || colors.matisse;
        this._disabledBackground = style.disabledBackground || colors.madang;

        this.updateToggleState();
    }

    toggle() {
        if (this.isDisabled) return;
        this.isToggled = !this.isToggled;
        this.updateToggleState();
    }

    setDisabled(disabled) {
        this.isDisabled = disabled;
        this.updateToggleState();
    }

    updateToggleState() {
        if (this.isDisabled) {
            this.setStyle({
                fill: this._disabledColor,
                backgroundColor: this._disabledBackground
            });
        } else if (this.isToggled) {
            this.setStyle({
                fill: this._toggledColor,
                backgroundColor: this._toggledBackground
            });
        } else {
            this.setStyle({
                fill: this._untoggledColor,
                backgroundColor: this._untoggledBackground
            });
        }
    }

    // Override to handle hover states even when toggled
    enterButtonActiveState() {
        super.enterButtonActiveState();
    }

    enterButtonInactiveState() {
        if (this.isDisabled) {
            this.setStyle({
                fill: this._disabledColor,
                backgroundColor: this._disabledBackground
            });
        } else if (this.isToggled) {
            this.setStyle({
                fill: this._toggledColor,
                backgroundColor: this._toggledBackground
            });
        } else {
            super.enterButtonInactiveState();
        }
    }
}