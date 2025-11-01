import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CustomTheme = "aurora" | "sunrise" | "moonlight" | "default";

interface ThemeContextType {
  customTheme: CustomTheme;
  setCustomTheme: (theme: CustomTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function CustomThemeProvider({ children }: { children: ReactNode }) {
  const [customTheme, setCustomThemeState] = useState<CustomTheme>(() => {
    const stored = localStorage.getItem("custom-theme");
    return (stored as CustomTheme) || "default";
  });

  useEffect(() => {
    localStorage.setItem("custom-theme", customTheme);
  }, [customTheme]);

  const setCustomTheme = (theme: CustomTheme) => {
    setCustomThemeState(theme);
  };

  return (
    <ThemeContext.Provider value={{ customTheme, setCustomTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useCustomTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useCustomTheme must be used within CustomThemeProvider");
  }
  return context;
}
