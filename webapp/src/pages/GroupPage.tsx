import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button, List, Section, Cell, Avatar, Title, Text } from '@telegram-apps/telegram-ui';
import { groupsApi, expensesApi, balancesApi } from '../utils/api';
import type { Expense, BalanceInfo, GroupDetail } from '../utils/api';

export const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo>({ total: 0, debts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    const loadData = async () => {
      setLoading(true);
      // Параллельный запрос трёх независимых ресурсов — быстрее, чем последовательный.
      const [groupData, expensesData, balances] = await Promise.all([
        groupsApi.getById(groupId),
        expensesApi.getByGroup(groupId),
        balancesApi.getByGroup(groupId),
      ]);
      setGroup(groupData);
      setExpenses(expensesData);
      setBalanceInfo(balances);
      setLoading(false);
    };
    loadData();
  }, [groupId]);

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;
  if (!group) return <div style={{ padding: 20 }}>Группа не найдена</div>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <Title level="2">{group.icon} {group.name}</Title>
          <Text style={{ color: 'var(--tg-hint-color)' }}>
            Всего потрачено: {balanceInfo.total} ₽
          </Text>
        </div>
        <Button onClick={() => navigate(`/group/${groupId}/add-expense`)} mode="filled">
          + Расход
        </Button>
      </div>

      {balanceInfo.debts.length > 0 && (
        <div style={{ marginBottom: 20, padding: 12, background: 'var(--tg-bg-color)', borderRadius: 12 }}>
          <Text weight="2">Кто кому должен:</Text>
          {balanceInfo.debts.map(debt => (
            <Text key={debt.userId} style={{ fontSize: 14 }}>
              {debt.amount > 0
                ? `💰 ${debt.userName} получит ${debt.amount} ₽`
                : `💸 ${debt.userName} должен ${-debt.amount} ₽`
              }
            </Text>
          ))}
        </div>
      )}

      <List>
        <Section header="История расходов">
          {expenses.length === 0 && <Cell>Пока нет расходов. Добавьте первый!</Cell>}
          {expenses.map((exp) => (
            <Cell
              key={exp.id}
              before={<Avatar>💰</Avatar>}
              subtitle={`Заплатил: ${exp.paidBy} • ${new Date(exp.date).toLocaleDateString()}`}
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
