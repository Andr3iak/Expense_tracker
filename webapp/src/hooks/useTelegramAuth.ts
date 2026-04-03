import { useInitData } from '@telegram-apps/sdk-react';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
}

export const useTelegramAuth = () => {
  const initData = useInitData();
  const user = initData?.user;

  const telegramUser: TelegramUser | null = user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        languageCode: user.languageCode,
        photoUrl: user.photoUrl,
      }
    : null;

  return {
    user: telegramUser,
    isAuthenticated: !!user,
    initData,
  };
};