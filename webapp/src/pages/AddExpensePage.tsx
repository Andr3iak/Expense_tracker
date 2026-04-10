import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button, Input, Title } from '@telegram-apps/telegram-ui';

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
        <Button stretched mode="filled" type="submit" style={{ marginTop: 24 }}>
          Добавить расход
        </Button>
      </form>
    </div>
  );
};