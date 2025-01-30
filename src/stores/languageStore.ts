import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = {
  code: string;
  name: string;
};

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
];

interface LanguageState {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
}

const getDefaultLanguage = (): Language => {
  const browserLang = navigator.language.split('-')[0];
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.code === browserLang) ||
    SUPPORTED_LANGUAGES[0]
  );
};

export const useLanguage = create<LanguageState>()(
  persist(
    (set) => ({
      currentLanguage: getDefaultLanguage(),
      setLanguage: (language) => set({ currentLanguage: language }),
    }),
    {
      name: 'chromarx-language',
    }
  )
);