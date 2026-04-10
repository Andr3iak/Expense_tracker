import { useEffect, useState } from 'react';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
}

export const useTelegramAuth = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [initDataRaw, setInitDataRaw] = useState<string | undefined>(undefined);
  const [isTelegramEnv, setIsTelegramEnv] = useState(false);

  useEffect(() => {
    const telegram = (window as any).Telegram?.WebApp;
    if (telegram) {
      setIsTelegramEnv(true);
      const initData = telegram.initData;
      const initDataUnsafe = telegram.initDataUnsafe;
      setInitDataRaw(initData);
      if (initDataUnsafe?.user) {
        const u = initDataUnsafe.user;
        setUser({
          id: u.id,
          firstName: u.first_name || u.firstName,
          lastName: u.last_name || u.lastName,
          username: u.username,
          languageCode: u.language_code || u.languageCode,
          photoUrl: u.photo_url || u.photoUrl,
        });
      }
    } else {
      console.warn('⚠️ Запуск вне Telegram, использую тестового пользователя');
      setUser({
        id: 99999999,
        firstName: 'Тестовый',
        lastName: 'Пользователь',
        username: 'test_user',
        languageCode: 'ru',
      });
      setInitDataRaw('mock_init_data_string');
    }
  }, []);

  return { user, initDataRaw, isTelegramEnv };
};