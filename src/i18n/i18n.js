import { translations } from '../i18n/translations.js';

export const I18n = {
    currentLang: 'en', // lingua di default

    setLang(lang) {
        if (translations[lang]) {
            this.currentLang = lang;
        }
    },

    t(key) {
        return translations[this.currentLang][key] || key;
    }
};
