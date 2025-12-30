import { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from "react";

type Language = "km" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (km: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "rueng_language";

function getInitialLanguage(): Language {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "km" || saved === "en") {
      return saved;
    }
  }
  return "km";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const t = (km: string, en: string) => {
    return language === "km" ? km : en;
  };

  // Apply fonts based on language
  // Battambang (from Google Fonts) is always included for Khmer text rendering
  useEffect(() => {
    if (language === "km") {
      // Khmer mode: Khmer font first, Inter as fallback for English text
      document.documentElement.style.setProperty('--font-sans', "Battambang, 'Noto Sans Khmer', Inter, sans-serif");
      document.documentElement.style.setProperty('--font-title', "Battambang, Inter, sans-serif");
    } else {
      // English mode: Inter first, but include Battambang for any Khmer text
      document.documentElement.style.setProperty('--font-sans', "Inter, Battambang, 'Noto Sans Khmer', sans-serif");
      document.documentElement.style.setProperty('--font-title', "Inter, Battambang, sans-serif");
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
