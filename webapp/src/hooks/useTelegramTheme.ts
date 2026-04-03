import { useEffect, useState } from 'react';
import { useThemeParams } from '@telegram-apps/sdk-react';

export interface TelegramTheme {
  bgColor: string;
  textColor: string;
  hintColor: string;
  linkColor: string;
  buttonColor: string;
  buttonTextColor: string;
  isDark: boolean;
}

export const useTelegramTheme = (): TelegramTheme => {
  const themeParams = useThemeParams();
  const [theme, setTheme] = useState<TelegramTheme>({
    bgColor: '#ffffff',
    textColor: '#000000',
    hintColor: '#999999',
    linkColor: '#2aabee',
    buttonColor: '#2aabee',
    buttonTextColor: '#ffffff',
    isDark: false,
  });

  useEffect(() => {
    if (themeParams) {
      setTheme({
        bgColor: themeParams.backgroundColor || '#ffffff',
        textColor: themeParams.textColor || '#000000',
        hintColor: themeParams.hintColor || '#999999',
        linkColor: themeParams.linkColor || '#2aabee',
        buttonColor: themeParams.buttonColor || '#2aabee',
        buttonTextColor: themeParams.buttonTextColor || '#ffffff',
        isDark: themeParams.isDark || false,
      });
    }
  }, [themeParams]);

  return theme;
};