import React, { ReactNode } from 'react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { useTelegramTheme } from '../hooks';

interface TelegramThemeProviderProps {
  children: ReactNode;
}

export const TelegramThemeProvider: React.FC<TelegramThemeProviderProps> = ({ children }) => {
  const theme = useTelegramTheme();

  return (
    <AppRoot
      appearance={theme.isDark ? 'dark' : 'light'}
      style={{
        backgroundColor: theme.bgColor,
        color: theme.textColor,
        minHeight: '100vh',
      }}
    >
      {children}
    </AppRoot>
  );
};