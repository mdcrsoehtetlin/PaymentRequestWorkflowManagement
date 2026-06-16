import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en.json';
import jaTranslations from './locales/ja.json';
import myTranslations from './locales/my.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    ja: { translation: jaTranslations },
    my: { translation: myTranslations },
  },
  lng: 'en', // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already safes from xss
  },
});

export default i18n;
