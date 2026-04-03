import { useNavigate } from 'react-router-dom';

const MOCK_GROUPS = [
  { id: '1', name: 'Поездка на море', balance: 1234, membersCount: 4, lastActivity: 'сегодня' },
  { id: '2', name: 'Квартира', balance: -567, membersCount: 2, lastActivity: 'вчера' },
];

export const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '16px' }}>
      <h2>Привет, друг! 👋</h2>
      <button
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '20px',
          background: '#2aabee',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
        }}
      >
        + Создать группу
      </button>

      <h3>Ваши группы</h3>
      {MOCK_GROUPS.map((group) => (
        <div
          key={group.id}
          onClick={() => navigate(`/group/${group.id}`)}
          style={{
            padding: '12px',
            marginBottom: '8px',
            background: '#f5f5f5',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <strong>{group.name}</strong>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {group.membersCount} участника • {group.lastActivity}
            </div>
          </div>
          <div style={{ color: group.balance >= 0 ? 'green' : 'red' }}>
            {group.balance >= 0 ? '+' : '-'}{Math.abs(group.balance)} ₽
          </div>
        </div>
      ))}
    </div>
  );
};