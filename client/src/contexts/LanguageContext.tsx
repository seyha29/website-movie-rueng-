import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "km" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (km: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("km");

  const t = (km: string, en: string) => {
    return language === "km" ? km : en;
  };

  // Apply fonts based on language
  // Khmer OS Battambang is always included for Khmer text rendering in both languages
  useEffect(() => {
    if (language === "km") {
      // Khmer mode: Khmer font first, Inter as fallback for English text
      document.documentElement.style.setProperty('--font-sans', "'Khmer OS Battambang', 'Noto Sans Khmer', Inter, sans-serif");
      document.documentElement.style.setProperty('--font-title', "'Khmer OS Battambang', Inter, sans-serif");
    } else {
      // English mode: Inter first, but include Khmer OS Battambang for any Khmer text
      document.documentElement.style.setProperty('--font-sans', "Inter, 'Khmer OS Battambang', 'Noto Sans Khmer', sans-serif");
      document.documentElement.style.setProperty('--font-title', "Inter, 'Khmer OS Battambang', sans-serif");
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
