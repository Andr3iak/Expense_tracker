import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegramAuth } from '../hooks';
import { groupsApi } from '../utils/api';
import { Group } from '../types';

// Мок-данные для начального отображения (можно потом заменить на реальные с бэкенда)
const MOCK_GROUPS: Group[] = [
  { id: '1', name: 'Поездка на море', icon: '🏖️', balance: 1234, membersCount: 4, lastActivity: 'сегодня' },
  { id: '2', name: 'Квартира', icon: '🏠', balance: -567, membersCount: 2, lastActivity: 'вчера' },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useTelegramAuth();
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const formatBalance = (balance: number) => {
    const sign = balance > 0 ? '+' : balance < 0 ? '-' : '';
    const color = balance > 0 ? 'green' : balance < 0 ? 'red' : 'gray';
    return { sign, color, text: `${Math.abs(balance)} ₽` };
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setIsCreating(true);
    try {
      // Вызов реального API (замените URL если нужно)
      // const createdGroup = await groupsApi.create({ name: newGroupName });
      
      // Имитация ответа от бэкенда (пока нет сервера)
      const createdGroup: Group = {
        id: Date.now().toString(),
        name: newGroupName,
        icon: '🎉',
        balance: 0,
        membersCount: 1,
        lastActivity: 'только что',
      };

      // Обновляем список групп
      setGroups([createdGroup, ...groups]);
      setNewGroupName('');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Ошибка создания группы:', error);
      alert('Не удалось создать группу');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#2aabee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
          {user?.firstName?.charAt(0) || '👤'}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>Привет, {user?.firstName || 'друг'}! 👋</h2>
          <p style={{ margin: 0, color: '#666' }}>Вот твои группы расходов</p>
        </div>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#2aabee',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          marginBottom: '20px',
          cursor: 'pointer',
        }}
      >
        + Создать группу
      </button>

      {groups.length === 0 ? (
        <div>Нет групп. Создайте первую!</div>
      ) : (
        <div>
          <h3>Ваши группы</h3>
          {groups.map((group) => {
            const { sign, color, text } = formatBalance(group.balance);
            return (
              <div
                key={group.id}
                onClick={() => navigate(`/group/${group.id}`)}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{group.name}</strong>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {group.membersCount} участника • {group.lastActivity}
                  </div>
                </div>
                <div style={{ color, fontWeight: 'bold' }}>
                  {sign}{text}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно создания группы */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => !isCreating && setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '400px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Создать новую группу</h3>
            <form onSubmit={handleCreateGroup}>
              <input
                type="text"
                placeholder="Название группы"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '16px',
                }}
                required
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 16px', background: '#ccc', border: 'none', borderRadius: '6px' }}
                  disabled={isCreating}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 16px', background: '#2aabee', color: 'white', border: 'none', borderRadius: '6px' }}
                  disabled={isCreating}
                >
                  {isCreating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};