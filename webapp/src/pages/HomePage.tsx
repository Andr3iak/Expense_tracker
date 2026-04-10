import { useTelegramAuth } from '../hooks';

export const HomePage = () => {
  const { user, initDataRaw, isTelegramEnv } = useTelegramAuth();

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>📱 Трекер расходов</h1>
      <h2>Статус Telegram окружения:</h2>
      <p>{isTelegramEnv ? '✅ Запущено внутри Telegram' : '⚠️ Локальная разработка (мок-данные)'}</p>
      
      <h2>👤 Данные пользователя:</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      
      <h2>🔑 initDataRaw (для отправки на бэкенд):</h2>
      <pre style={{ fontSize: '12px', wordBreak: 'break-all', background: '#f0f0f0', padding: '8px', borderRadius: '4px' }}>
        {initDataRaw || 'нет данных'}
      </pre>
      
      <p>✨ Интерфейс работает, initData получена.</p>
    </div>
  );
};