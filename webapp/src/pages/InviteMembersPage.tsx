import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Card, SLabel, Av, C } from '../components/ui';
import { useUser } from '../context/UserContext';
import { groupsApi, usersApi } from '../utils/api';
import type { GroupDetail, AppUser } from '../utils/api';
import { avatarColor, initials } from '../components/ui';
import { hapticImpact, hapticNotification, shareLink } from '../hooks';

function displayName(firstName: string | null, username: string | null, id: number): string {
  return firstName || username || `User ${id}`;
}

function buildInviteLink(groupId: string): string {
  const botUsername = import.meta.env.VITE_BOT_USERNAME;
  if (botUsername) return `https://t.me/${botUsername}?startapp=join_${groupId}`;
  return `${window.location.origin}?join=${groupId}`;
}

export const InviteMembersPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [q, setQ] = useState('');
  const [searching, setSearching] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    if (!groupId) return;
    const [g, users] = await Promise.all([groupsApi.getById(groupId), usersApi.getAll()]);
    setGroup(g);
    setAllUsers(users);
  }, [groupId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Поиск по username с задержкой
  useEffect(() => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        // Сначала ищем локально среди загруженных пользователей
        const local = allUsers.filter((u) =>
          displayName(u.firstName, u.username, u.id)
            .toLowerCase()
            .includes(q.toLowerCase())
        );
        setSearchResults(local);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, allUsers]);

  if (!group) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  const memberIds = new Set(group.members.map((m) => m.userId));

  // Показываем результаты поиска или всех незарегистрированных участников
  const available = (q.trim() ? searchResults : allUsers).filter((u) => !memberIds.has(u.id));

  const addMember = async (userId: number) => {
    if (!groupId) return;
    hapticImpact('light');
    await groupsApi.addMember(groupId, userId);
    hapticNotification('success');
    await loadData();
    setQ('');
  };

  const removeMember = async (userId: number) => {
    if (!groupId) return;
    hapticImpact('medium');
    await groupsApi.removeMember(groupId, userId);
    await loadData();
  };

  const handleInvite = () => {
    if (!groupId) return;
    const link = buildInviteLink(groupId);
    const text = `Присоединяйся к группе расходов «${group.name}»!`;
    shareLink(link, text);
    const hasTg = !!(window as any).Telegram?.WebApp;
    if (!hasTg) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
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
        {/* Пригласить по ссылке */}
        <div style={{ padding: '12px 16px 4px' }}>
          <div onClick={handleInvite} style={{
            background: C.card, borderRadius: 12, padding: '13px 16px',
            display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
            border: `1px solid ${C.blue}20`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18, background: C.blue,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
            }}>📤</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: C.blue, fontWeight: 600, fontSize: 15 }}>Пригласить по ссылке</div>
              <div style={{ color: C.hint, fontSize: 12, marginTop: 2 }}>
                {copied ? '✓ Ссылка скопирована!' : 'Поделиться через Telegram'}
              </div>
            </div>
          </div>
        </div>

        {/* Поиск по username */}
        <div style={{ padding: '10px 16px' }}>
          <div style={{ background: C.card, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.hint }}>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по имени или username"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, background: 'none', fontFamily: 'inherit', color: C.text }}
            />
            {q && (
              <span onClick={() => setQ('')} style={{ color: C.hint, cursor: 'pointer', fontSize: 18 }}>×</span>
            )}
          </div>
          {searching && (
            <div style={{ fontSize: 12, color: C.hint, marginTop: 6, paddingLeft: 4 }}>Поиск...</div>
          )}
        </div>

        {/* Текущие участники */}
        <SLabel>В группе ({group.members.length})</SLabel>
        <Card>
          {group.members.map((m, i) => {
            const name = displayName(m.user.firstName, m.user.username, m.userId);
            const isMe = m.userId === user?.id;
            return (
              <div key={m.id} style={{
                padding: '10px 16px',
                borderBottom: i < group.members.length - 1 ? `0.5px solid ${C.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <Av m={{ initials: initials(name), color: avatarColor(m.userId) }} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{name}{isMe ? ' (вы)' : ''}</div>
                  {m.username && <div style={{ fontSize: 12, color: C.hint }}>@{m.username}</div>}
                </div>
                {!isMe && (
                  <button
                    onClick={() => removeMember(m.userId)}
                    style={{
                      background: C.red, border: 'none', borderRadius: '50%',
                      width: 24, height: 24, color: 'white', fontSize: 16,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >−</button>
                )}
              </div>
            );
          })}
        </Card>

        {/* Добавить участника */}
        <SLabel>Добавить</SLabel>
        <Card>
          {available.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: C.hint, fontSize: 14 }}>
              {q.trim() ? `Пользователь «${q}» не найден` : 'Все пользователи уже в группе'}
            </div>
          ) : (
            available.map((u, i) => {
              const name = displayName(u.firstName, u.username, u.id);
              return (
                <div key={u.id} onClick={() => addMember(u.id)} style={{
                  padding: '10px 16px',
                  borderBottom: i < available.length - 1 ? `0.5px solid ${C.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                }}>
                  <Av m={{ initials: initials(name), color: avatarColor(u.id) }} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{name}</div>
                    {u.username && <div style={{ fontSize: 12, color: C.hint }}>@{u.username}</div>}
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: 14, background: C.blue, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 300,
                  }}>+</div>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
};