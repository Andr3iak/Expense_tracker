import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, List, Section, Cell, Avatar, Title, Input } from '@telegram-apps/telegram-ui';
import { useUser } from '../context/UserContext';
import { groupsApi } from '../utils/api';
import type { Group } from '../utils/api';

export const HomePage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [archivedGroups, setArchivedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupIcon, setNewGroupIcon] = useState('');

  const loadGroups = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [active, archived] = await Promise.all([
        groupsApi.getAll(user.id),
        groupsApi.getArchived(user.id),
      ]);
      setGroups(active);
      setArchivedGroups(archived);
    } catch (err) {
      console.error('Ошибка загрузки групп:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadGroups();
  }, [user?.id]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !user) return;
    try {
      await groupsApi.create({ name: newGroupName, icon: newGroupIcon || undefined, userId: user.id });
      setNewGroupName('');
      setNewGroupIcon('');
      setShowCreate(false);
      await loadGroups();
    } catch (err) {
      alert('Ошибка при создании группы');
    }
  };

  const handleUnarchive = async (groupId: string) => {
    if (!user) return;
    try {
      await groupsApi.unarchive(groupId, user.id);
      await loadGroups();
    } catch (err) {
      alert('Ошибка при восстановлении группы');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Загрузка...</div>;

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level="2">Мои группы</Title>
        <Button mode="filled" onClick={() => setShowCreate(true)}>+ Создать</Button>
      </div>

      {/* Форма создания группы */}
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

      {/* Активные группы */}
      <List>
        <Section header="Ваши группы">
          {groups.length === 0 && <Cell>Нет групп. Создайте первую!</Cell>}
          {groups.map((group) => (
            <Cell
              key={group.id}
              before={<Avatar>{group.icon || '📁'}</Avatar>}
              subtitle={`${group.membersCount} участников`}
              after={
                <Button mode="plain" onClick={() => navigate(`/group/${group.id}`)}>
                  Открыть
                </Button>
              }
            >
              {group.name}
            </Cell>
          ))}
        </Section>
      </List>

      {/* Архив — показываем только если есть архивные группы */}
      {archivedGroups.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <Button
            mode="plain"
            onClick={() => setShowArchive(!showArchive)}
            style={{ color: 'var(--tg-hint-color)', marginBottom: 8 }}
          >
            📦 Архив ({archivedGroups.length}) {showArchive ? '▲' : '▼'}
          </Button>

          {showArchive && (
            <List>
              <Section header="Архивные группы">
                {archivedGroups.map((group) => (
                  <Cell
                    key={group.id}
                    before={<Avatar>{group.icon || '📁'}</Avatar>}
                    subtitle={`${group.membersCount} участников • архивирована`}
                    after={
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Button mode="plain" onClick={() => navigate(`/group/${group.id}`)}>
                          Открыть
                        </Button>
                        <Button mode="plain" onClick={() => handleUnarchive(group.id)}>
                          Восстановить
                        </Button>
                      </div>
                    }
                  >
                    {group.name}
                  </Cell>
                ))}
              </Section>
            </List>
          )}
        </div>
      )}
    </div>
  );
};