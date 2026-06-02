import React, { useEffect } from 'react';
import { useTelegramTheme } from '../hooks/useTelegramTheme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTelegramTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tg-bg-color', theme.bgColor);
    root.style.setProperty('--tg-text-color', theme.textColor);
    root.style.setProperty('--tg-hint-color', theme.hintColor);
    root.style.setProperty('--tg-link-color', theme.linkColor);
    root.style.setProperty('--tg-button-color', theme.buttonColor);
    root.style.setProperty('--tg-button-text-color', theme.buttonTextColor);
  }, [theme]);

  return <>{children}</>;
};