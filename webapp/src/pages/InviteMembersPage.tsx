// Экран управления участниками группы.
// Загружает всех зарегистрированных пользователей и показывает, кто уже в группе.

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Card, SLabel, Av, C } from '../components/ui';
import { useUser } from '../context/UserContext';
import { groupsApi, usersApi } from '../utils/api';
import type { GroupDetail, AppUser } from '../utils/api';
import { avatarColor, initials } from '../components/ui';

export const InviteMembersPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [q, setQ] = useState('');

  const loadData = async () => {
    if (!groupId) return;
    const [g, users] = await Promise.all([groupsApi.getById(groupId), usersApi.getAll()]);
    setGroup(g);
    setAllUsers(users);
  };

  useEffect(() => { loadData(); }, [groupId]);

  if (!group) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  // Множество id участников для быстрой проверки принадлежности
  const memberIds = new Set(group.members.map((m) => m.userId));
  const available = allUsers.filter(
    (u) => !memberIds.has(u.id) && (u.username || `User ${u.id}`).toLowerCase().includes(q.toLowerCase()),
  );

  const addMember = async (userId: number) => {
    if (!groupId) return;
    await groupsApi.addMember(groupId, userId);
    await loadData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <NavBar
        title="Участники"
        onBack={() => navigate(`/group/${groupId}`)}
        rightLabel="Готово"
        onRight={() => navigate(`/group/${groupId}`)}
      />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '10px 16px' }}>
          <div style={{ background: C.card, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.hint }}>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по имени"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, background: 'none', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <SLabel>В группе</SLabel>
        <Card>
          {group.members.map((m, i) => {
            const name = m.user.username || `User ${m.userId}`;
            const isMe = m.userId === user?.id;
            return (
              <div key={m.id} style={{
                padding: '10px 16px', borderBottom: i < group.members.length - 1 ? `0.5px solid ${C.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <Av m={{ initials: initials(name), color: avatarColor(m.userId) }} size={36} />
                <div style={{ flex: 1, fontWeight: 500 }}>{name}{isMe ? ' (вы)' : ''}</div>
                {/* Создателя группы (себя) нельзя удалить */}
                {!isMe && (
                  <button style={{
                    background: C.red, border: 'none', borderRadius: '50%', width: 24, height: 24,
                    color: 'white', fontSize: 16, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>−</button>
                )}
              </div>
            );
          })}
        </Card>

        <SLabel>Добавить</SLabel>
        <Card>
          {available.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: C.hint, fontSize: 14 }}>
              Все пользователи уже в группе
            </div>
          )}
          {available.map((u, i) => {
            const name = u.username || `User ${u.id}`;
            return (
              <div key={u.id} onClick={() => addMember(u.id)} style={{
                padding: '10px 16px', borderBottom: i < available.length - 1 ? `0.5px solid ${C.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }}>
                <Av m={{ initials: initials(name), color: avatarColor(u.id) }} size={36} />
                <div style={{ flex: 1, fontWeight: 500 }}>{name}</div>
                <div style={{
                  width: 28, height: 28, borderRadius: 14, background: C.blue, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 300,
                }}>+</div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
};
