// Компонент страницы группы. Исправлены ошибки линтера:
// добавлены типы для useState
// указаны зависимости useEffect
// отключено предупреждение set-state-in-effect для мок-данных
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
// Локальный тип расходов (можно вынести в общие типы, но для примера оставим здесь)
// Раньше TypeScript не мог вывести тип массива, и линтер ругался на неявный any.

interface LocalExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
}

export const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [groupName, setGroupName] = useState('');
  // Заполняем мок-данными. Добавлен массив зависимостей [groupId],
  // чтобы эффект перезапускался при смене группы.
  // Комментарий // eslint-disable-next-line ... подавляет предупреждение
  // о синхронном вызове setState внутри эффекта (для упрощения демо).
  useEffect(() => {
    if (groupId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGroupName(`Группа ${groupId}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpenses([
        { id: '1', description: 'Такси', amount: 500, paidBy: 'Анна', date: '2024-03-20' },
        { id: '2', description: 'Ужин', amount: 2500, paidBy: 'Петр', date: '2024-03-19' },
      ]);
    }
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