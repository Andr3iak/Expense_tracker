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
  const rawBot = (import.meta.env.VITE_BOT_USERNAME ?? '') as string;
  const botName = rawBot.replace('@', '');
  const appShortName = (import.meta.env.VITE_APP_SHORT_NAME ?? '') as string;
  if (botName && appShortName) return `https://t.me/${botName}/${appShortName}?startapp=join_${groupId}`;
  if (botName) return `https://t.me/${botName}?start=join_${groupId}`;
  return `${window.location.origin}?join=${groupId}`;
}

export const InviteMembersPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [knownUsers, setKnownUsers] = useState<AppUser[]>([]);
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(false);
  // userId → 'invited' | 'adding' для UI-фидбека без перезагрузки
  const [inviteStatus, setInviteStatus] = useState<Record<number, 'inviting' | 'invited'>>({});

  const loadData = useCallback(async () => {
    if (!groupId || !user) return;
    const [g, known] = await Promise.all([
      groupsApi.getById(groupId),
      // Только пользователи из общих групп — не вся база
      usersApi.getKnown(user.id),
    ]);
    setGroup(g);
    setKnownUsers(known);
  }, [groupId, user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!group) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  const memberIds = new Set(group.members.map((m) => m.userId));

  const filtered = knownUsers.filter((u) => {
    if (memberIds.has(u.id)) return false;
    if (!q.trim()) return true;
    return displayName(u.firstName, u.username, u.id).toLowerCase().includes(q.toLowerCase());
  });

  const sendInvite = async (userId: number) => {
    if (!groupId || !user) return;
    hapticImpact('light');
    setInviteStatus((s) => ({ ...s, [userId]: 'inviting' }));
    try {
      await groupsApi.sendInvitation(groupId, userId, user.id);
      hapticNotification('success');
      setInviteStatus((s) => ({ ...s, [userId]: 'invited' }));
    } catch {
      setInviteStatus((s) => { const next = { ...s }; delete next[userId]; return next; });
    }
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
    shareLink(link, `Присоединяйся к группе расходов «${group.name}»!`);
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

        <div style={{ padding: '10px 16px' }}>
          <div style={{ background: C.card, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.hint }}>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Поиск по имени или username"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, background: 'none', fontFamily: 'inherit', color: C.text }}
            />
            {q && <span onClick={() => setQ('')} style={{ color: C.hint, cursor: 'pointer', fontSize: 18 }}>×</span>}
          </div>
        </div>

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

        {/* Пользователи из общих групп — не вся база приложения */}
        <SLabel>Известные пользователи</SLabel>
        <Card>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px 20px', textAlign: 'center', color: C.hint, fontSize: 14 }}>
              {q.trim()
                ? `«${q}» не найден среди ваших контактов`
                : 'Нет знакомых пользователей. Пригласите по ссылке!'}
            </div>
          ) : (
            filtered.map((u, i) => {
              const name = displayName(u.firstName, u.username, u.id);
              const status = inviteStatus[u.id];
              return (
                <div key={u.id} style={{
                  padding: '10px 16px',
                  borderBottom: i < filtered.length - 1 ? `0.5px solid ${C.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                  opacity: status === 'inviting' ? 0.5 : 1,
                }}>
                  <Av m={{ initials: initials(name), color: avatarColor(u.id) }} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{name}</div>
                    {u.username && <div style={{ fontSize: 12, color: C.hint }}>@{u.username}</div>}
                  </div>
                  {status === 'invited' ? (
                    <div style={{ fontSize: 12, color: C.hint }}>Приглашён ✓</div>
                  ) : (
                    <div
                      onClick={() => !status && sendInvite(u.id)}
                      style={{
                        width: 28, height: 28, borderRadius: 14, background: C.blue, color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, fontWeight: 300, cursor: 'pointer',
                      }}
                    >+</div>
                  )}
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
};
