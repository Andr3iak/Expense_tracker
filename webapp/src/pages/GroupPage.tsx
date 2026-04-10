import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button, List, Section, Cell, Avatar, Title, Text } from '@telegram-apps/telegram-ui';

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

  useEffect(() => {
    if (groupId) {
      setGroupName(`Группа ${groupId}`);
      setExpenses([
        { id: '1', description: 'Такси', amount: 500, paidBy: 'Анна', date: '2024-03-20' },
        { id: '2', description: 'Ужин', amount: 2500, paidBy: 'Петр', date: '2024-03-19' },
      ]);
    }
  }, [groupId]);

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level="2">{groupName}</Title>
        <Button onClick={() => navigate(`/group/${groupId}/add-expense`)} mode="filled">
          + Расход
        </Button>
      </div>

      <List>
        <Section header="История расходов">
          {expenses.map((exp) => (
            <Cell
              key={exp.id}
              before={<Avatar>💰</Avatar>}
              subtitle={`${exp.paidBy} • ${new Date(exp.date).toLocaleDateString()}`}
              after={<Text style={{ fontWeight: 'bold' }}>{exp.amount} ₽</Text>}
            >
              {exp.description}
            </Cell>
          ))}
        </Section>
      </List>
    </div>
  );
};