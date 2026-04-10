import { useEffect, useState } from 'react';

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
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.themeParams) {
      const tp = tg.themeParams;
      setTheme({
        bgColor: tp.bg_color || '#ffffff',
        textColor: tp.text_color || '#000000',
        hintColor: tp.hint_color || '#999999',
        linkColor: tp.link_color || '#2aabee',
        buttonColor: tp.button_color || '#2aabee',
        buttonTextColor: tp.button_text_color || '#ffffff',
        isDark: tg.colorScheme === 'dark',
      });
    }
  }, []);

  return theme;
};