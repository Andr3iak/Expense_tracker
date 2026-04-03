import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    // Временно заглушка
    setGroupName(`Группа ${groupId}`);
    setExpenses([
      { id: '1', description: 'Такси', amount: 500, paidBy: 'Анна', date: '2024-03-20' },
      { id: '2', description: 'Ужин', amount: 2500, paidBy: 'Петр', date: '2024-03-19' },
    ]);
  }, [groupId]);

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>{groupName}</h2>
        <button
          onClick={() => navigate(`/group/${groupId}/add-expense`)}
          style={{ background: '#2aabee', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px' }}
        >
          + Расход
        </button>
      </div>

      <h3>История расходов</h3>
      {expenses.map((exp) => (
        <div key={exp.id} style={{ padding: '12px', marginBottom: '8px', background: '#f5f5f5', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{exp.description}</strong>
            <span>{exp.amount} ₽</span>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>{exp.paidBy} • {new Date(exp.date).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  );
};