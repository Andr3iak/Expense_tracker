import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTelegramAuth } from '../hooks';
import { usersApi } from '../utils/api';
import type { DbUser } from '../utils/api';

interface UserContextValue {
  user: DbUser | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({ user: null, loading: true });

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user: telegramUser } = useTelegramAuth();
  const [user, setUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!telegramUser) return;

    usersApi
      .upsert({
        telegramId: telegramUser.id,
        username: telegramUser.username,
        firstName: telegramUser.firstName,
      })
      .then((dbUser) => {
        setUser(dbUser);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Ошибка авторизации:', err);
        setLoading(false);
      });
  }, [telegramUser?.id]); // зависимость от id, а не от объекта — избегаем лишних вызовов

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>;
};
