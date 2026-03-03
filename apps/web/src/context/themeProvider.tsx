import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { ThemeContext } from './themeContext';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    const forcedDarkPaths = ['/', '/login', '/register'];
    const isForcedDark = forcedDarkPaths.includes(location.pathname);

    const theme = isForcedDark ? 'dark' : isDarkMode ? 'dark' : 'light';

    document.documentElement.setAttribute('data-theme', theme);

    if (!isForcedDark) {
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode, location.pathname]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}
