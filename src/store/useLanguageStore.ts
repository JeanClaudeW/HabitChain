import { create } from 'zustand';
import { SupportedLanguage } from '../utils/translations';

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

export const useLanguageStore = create<LanguageState>(set => ({
  language: 'English',
  setLanguage: lang => set({ language: lang }),
}));
