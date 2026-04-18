import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ theme: "dark", toggle: () => {}, setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem("desktop_theme") || "dark";
  });

  useEffect(() => {
    localStorage.setItem("desktop_theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

// Helper class strings for apps
export const themed = (isDark) => ({
  bg: isDark ? "bg-[#1c1c1e]" : "bg-[#f5f5f7]",
  bgAlt: isDark ? "bg-[#101012]" : "bg-white",
  bgPanel: isDark ? "bg-[#2c2c2e]" : "bg-white",
  text: isDark ? "text-white" : "text-[#1c1c1e]",
  textMuted: isDark ? "text-white/60" : "text-black/60",
  textSubtle: isDark ? "text-white/40" : "text-black/40",
  textFaint: isDark ? "text-white/25" : "text-black/30",
  border: isDark ? "border-white/10" : "border-black/10",
  hover: isDark ? "hover:bg-white/10" : "hover:bg-black/5",
  inputBg: isDark ? "bg-white/10" : "bg-black/5",
  divider: isDark ? "bg-white/10" : "bg-black/10",
});
