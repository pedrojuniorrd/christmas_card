import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "pt" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currency: "BRL" | "USD";
  price: number;
  priceFormatted: string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("pt");

  // Definições de Preço e Moeda baseadas no idioma
  const currency = language === "pt" ? "BRL" : "USD";
  const price = language === "pt" ? 10 : 5; // R$ 10 ou $ 5
  const priceFormatted = language === "pt" 
    ? "R$ 10,00" 
    : "$ 5.00";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currency, price, priceFormatted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
};