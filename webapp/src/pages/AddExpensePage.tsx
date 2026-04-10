// src/pages/AddExpensePage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button, Input, Title } from '@telegram-apps/telegram-ui';
import { useTelegramAuth } from '../hooks';
import { mockExpensesApi } from '../services/mockDb';

export const AddExpensePage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useTelegramAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId || !user) return;
    setLoading(true);
    try {
      await mockExpensesApi.create(groupId, {
        amount: parseFloat(amount),
        description,
        paidBy: user.id,
        participants: [user.id], // упрощённо: только текущий пользователь
      });
      navigate(`/group/${groupId}`);
    } catch (err) {
      alert('Ошибка при сохранении расхода');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <Title level="2" style={{ marginBottom: 20 }}>Новый расход</Title>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <Input
            header="Сумма"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Input
            header="Описание"
            placeholder="Например: такси, ужин..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <Button stretched mode="filled" type="submit" disabled={loading} style={{ marginTop: 24 }}>
          {loading ? 'Сохранение...' : 'Добавить расход'}
        </Button>
      </form>
    </div>
  );
};