// src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, List, Section, Cell, Avatar, Title, Input } from '@telegram-apps/telegram-ui';
import { useTelegramAuth } from '../hooks';
import { mockGroupsApi, mockBalancesApi } from '../services/mockDb';
import type { Group } from '../utils/api.ts';

export const HomePage = () => {
  const { user } = useTelegramAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('');

  const loadGroups = async () => {
    setLoading(true);
    const data = await mockGroupsApi.getAll();
    // Для каждой группы подгружаем баланс (общую сумму расходов)
    const groupsWithBalance = await Promise.all(
      data.map(async (g) => {
        const { total } = await mockBalancesApi.getByGroup(g.id);
        return { ...g, balance: total };
      })
    );
    setGroups(groupsWithBalance);
    setLoading(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    await mockGroupsApi.create({ name: newGroupName, icon: newGroupIcon || undefined });
    setNewGroupName('');
    setNewGroupIcon('');
    setShowCreate(false);
    await loadGroups();
  };

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level="2">Мои группы</Title>
        <div>Привет, {user?.firstName}!</div>
        <Button mode="filled" onClick={() => setShowCreate(true)}>+ Создать</Button>
      </div>

      {showCreate && (
        <div style={{ marginBottom: 20, padding: 16, background: 'var(--tg-bg-color)', borderRadius: 12 }}>
          <Input
            header="Название группы"
            placeholder="Например: Рыбалка"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <Input
            header="Иконка (эмодзи)"
            placeholder="🏕️"
            value={newGroupIcon}
            onChange={(e) => setNewGroupIcon(e.target.value)}
            style={{ marginTop: 12 }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <Button mode="filled" onClick={handleCreateGroup}>Создать</Button>
            <Button mode="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
          </div>
        </div>
      )}

      <List>
        <Section header="Ваши группы">
          {groups.length === 0 && <Cell>Нет групп. Создайте первую!</Cell>}
          {groups.map((group) => (
            <Cell
              key={group.id}
              before={<Avatar>{group.icon || '📁'}</Avatar>}
              subtitle={`${group.membersCount} участников • всего ${group.balance} ₽`}
              after={<Button mode="plain" onClick={() => navigate(`/group/${group.id}`)}>Открыть</Button>}
            >
              {group.name}
            </Cell>
          ))}
        </Section>
      </List>
    </div>
  );
};