import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button, List, Section, Cell, Avatar, Title, Text } from '@telegram-apps/telegram-ui';
import { groupsApi, expensesApi, balancesApi } from '../utils/api';
import { useUser } from '../context/UserContext';
import type { Expense, BalanceInfo, GroupDetail } from '../utils/api';

export const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo>({
    total: 0,
    debts: [],
    balances: [],
    transactions: [],
  });
  const [loading, setLoading] = useState(true);

  // Состояние формы редактирования
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const [groupData, expensesData, balances] = await Promise.all([
          groupsApi.getById(groupId),
          expensesApi.getByGroup(groupId),
          balancesApi.getByGroup(groupId),
        ]);
        setGroup(groupData);
        setEditName(groupData.name);
        setEditIcon(groupData.icon ?? '');
        setExpenses(expensesData);
        setBalanceInfo(balances);
      } catch (err) {
        console.error('Ошибка загрузки группы:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [groupId]);

  const handleSaveEdit = async () => {
    if (!groupId || !user || !editName.trim()) return;
    setEditLoading(true);
    try {
      const updated = await groupsApi.update(groupId, {
        name: editName,
        icon: editIcon || undefined,
        userId: user.id,
      });
      setGroup((prev) => prev ? { ...prev, name: updated.name, icon: updated.icon ?? null } : prev);
      setShowEdit(false);
    } catch (err) {
      alert('Ошибка при сохранении');
    } finally {
      setEditLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!groupId || !user) return;
    const confirm = window.confirm('Переместить группу в архив? Она исчезнет с главного экрана, но данные сохранятся.');
    if (!confirm) return;
    try {
      await groupsApi.archive(groupId, user.id);
      navigate('/'); // возвращаемся на главную
    } catch (err) {
      alert('Ошибка при архивировании');
    }
  };

  const handleCopyInvite = () => {
    const botUsername = import.meta.env.VITE_BOT_USERNAME ?? 'Ex3penseTracker_bot';
    const appShortName = import.meta.env.VITE_APP_SHORT_NAME ?? 'app';
    const link = `https://t.me/${botUsername}/${appShortName}?startapp=${groupId}`;
    navigator.clipboard.writeText(link).then(() => alert('Ссылка скопирована!'));
  };

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;
  if (!group) return <div style={{ padding: 20 }}>Группа не найдена</div>;

  return (
    <div style={{ padding: '16px' }}>

      {/* Заголовок */}
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

      {/* Кнопки управления группой */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Button mode="outline" onClick={() => setShowEdit(!showEdit)}>
          ✏️ Редактировать
        </Button>
        <Button mode="outline" onClick={handleCopyInvite}>
          🔗 Пригласить
        </Button>
        <Button mode="outline" onClick={handleArchive} style={{ color: 'var(--tg-hint-color)' }}>
          📦 В архив
        </Button>
      </div>

      {/* Форма редактирования */}
      {showEdit && (
        <div style={{
          marginBottom: 16,
          padding: 16,
          background: 'var(--tg-bg-color)',
          borderRadius: 12,
          border: '1px solid var(--tg-hint-color)',
        }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 14, color: 'var(--tg-hint-color)' }}>Название</label>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{
                display: 'block',
                width: '100%',
                marginTop: 4,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--tg-hint-color)',
                background: 'transparent',
                color: 'var(--tg-text-color)',
                fontSize: 16,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 14, color: 'var(--tg-hint-color)' }}>Иконка (эмодзи)</label>
            <input
              value={editIcon}
              onChange={(e) => setEditIcon(e.target.value)}
              placeholder="🏕️"
              style={{
                display: 'block',
                width: '100%',
                marginTop: 4,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--tg-hint-color)',
                background: 'transparent',
                color: 'var(--tg-text-color)',
                fontSize: 16,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button mode="filled" onClick={handleSaveEdit} disabled={editLoading}>
              {editLoading ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button mode="outline" onClick={() => setShowEdit(false)}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      {/* Долги */}
      {balanceInfo.transactions.length > 0 && (
        <div style={{ marginBottom: 20, padding: 12, background: 'var(--tg-bg-color)', borderRadius: 12 }}>
          <Text weight="2">Кто кому должен:</Text>
          {balanceInfo.transactions.map((t, i) => (
            <Text key={i} style={{ fontSize: 14, display: 'block', marginTop: 4 }}>
              💸 {t.fromName} → {t.toName}: {t.amount} ₽
            </Text>
          ))}
        </div>
      )}

      {/* История расходов */}
      <List>
        <Section header="История расходов">
          {expenses.length === 0 && <Cell>Пока нет расходов. Добавьте первый!</Cell>}
          {expenses.map((exp) => (
            <Cell
              key={exp.id}
              before={<Avatar>💰</Avatar>}
              subtitle={`Заплатил: ${exp.paidByName ?? exp.paidBy} • ${new Date(exp.date).toLocaleDateString()}`}
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