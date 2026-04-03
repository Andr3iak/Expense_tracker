import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const AddExpensePage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Расход добавлен: ${description} на сумму ${amount} ₽`);
    navigate(`/group/${groupId}`);
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2>Новый расход</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label>Сумма</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label>Описание</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </div>
        <button type="submit" style={{ background: '#2aabee', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px' }}>
          Добавить
        </button>
      </form>
    </div>
  );
};