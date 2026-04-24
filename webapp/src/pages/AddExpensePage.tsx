import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button, Input, Title } from '@telegram-apps/telegram-ui';
import { useUser } from '../context/UserContext';
import { groupsApi, expensesApi } from '../utils/api';

export const AddExpensePage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [memberIds, setMemberIds] = useState<number[]>([]);

  useEffect(() => {
    if (!groupId) return;
    // Загружаем участников группы, чтобы расход делился на всех, а не только на текущего юзера.
    groupsApi.getById(groupId).then((group) => {
      setMemberIds(group.members.map((m) => m.userId));
    });
  }, [groupId]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!groupId || !user) return;
    setLoading(true);
    try {
      const participants = memberIds.length > 0 ? memberIds : [user.id];
      await expensesApi.create(groupId, {
        amount: parseFloat(amount),
        description,
        paidBy: user.id,
        participantIds: participants,
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
