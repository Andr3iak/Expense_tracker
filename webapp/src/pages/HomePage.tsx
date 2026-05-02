import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, SLabel, C } from '../components/ui';
import { useUser } from '../context/UserContext';
import { groupsApi } from '../utils/api';
import type { Group, GroupInvitation } from '../utils/api';

export const HomePage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [archivedGroups, setArchivedGroups] = useState<Group[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);
  const [handlingInvite, setHandlingInvite] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!user) return;
    try {
      const [active, archived, invites] = await Promise.all([
        groupsApi.getAll(user.id),
        groupsApi.getArchived(user.id),
        groupsApi.getMyInvitations(user.id),
      ]);
      setGroups(active);
      setArchivedGroups(archived);
      setInvitations(invites);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { if (user) loadAll(); }, [user?.id]);

  const handleUnarchive = async (groupId: string) => {
    if (!user) return;
    await groupsApi.unarchive(groupId, user.id).catch(() => {});
    loadAll();
  };

  const handleAccept = async (inv: GroupInvitation) => {
    if (!user || handlingInvite) return;
    setHandlingInvite(inv.id);
    try {
      await groupsApi.acceptInvitation(inv.id, user.id);
      await loadAll();
      navigate(`/group/${inv.groupId}`);
    } finally {
      setHandlingInvite(null);
    }
  };

  const handleReject = async (inv: GroupInvitation) => {
    if (!user || handlingInvite) return;
    setHandlingInvite(inv.id);
    try {
      await groupsApi.rejectInvitation(inv.id, user.id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
    } finally {
      setHandlingInvite(null);
    }
  };

  const displayName = user?.firstName || user?.username || 'User';
  const av = displayName.slice(0, 2).toUpperCase();

  if (loading) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, position: 'relative' }}>
      <div style={{
        background: C.card, padding: '22px 20px 18px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        borderBottom: `0.5px solid ${C.sep}`,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 36, background: C.blue,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: 26, marginBottom: 10,
        }}>{av}</div>
        <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: -0.3 }}>{displayName}</div>
        <div style={{ fontSize: 13, color: C.hint, marginTop: 3 }}>
          {user?.username ? `@${user.username}` : ''}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 88 }}>

        {/* Входящие приглашения */}
        {invitations.length > 0 && (
          <>
            <SLabel>Приглашения ({invitations.length})</SLabel>
            <Card>
              {invitations.map((inv, i) => (
                <div key={inv.id} style={{
                  padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: i < invitations.length - 1 ? `0.5px solid ${C.border}` : 'none',
                  opacity: handlingInvite === inv.id ? 0.5 : 1,
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 14, background: C.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  }}>{inv.groupIcon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{inv.groupName}</div>
                    <div style={{ fontSize: 12, color: C.hint, marginTop: 2 }}>
                      от {inv.invitedByName}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleReject(inv)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                        background: 'transparent', color: C.hint, fontSize: 13, cursor: 'pointer',
                      }}
                    >Отказ</button>
                    <button
                      onClick={() => handleAccept(inv)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, border: 'none',
                        background: C.blue, color: 'white', fontSize: 13,
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >Принять</button>
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}

        <SLabel>Активные группы</SLabel>
        <Card>
          {groups.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: C.hint, fontSize: 15 }}>
              Нет групп. Создайте первую!
            </div>
          )}
          {groups.map((g, i) => (
            <div key={g.id} onClick={() => navigate(`/group/${g.id}`)}
              onPointerDown={(e) => (e.currentTarget.style.background = '#F2F2F7')}
              onPointerUp={(e) => (e.currentTarget.style.background = '')}
              onPointerLeave={(e) => (e.currentTarget.style.background = '')}
              style={{
                padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12,
                borderBottom: i < groups.length - 1 ? `0.5px solid ${C.border}` : 'none',
                cursor: 'pointer', transition: 'background 0.1s',
              }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14, background: C.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
              }}>{g.icon || '📁'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{g.name}</div>
                <div style={{ fontSize: 13, color: C.hint, marginTop: 2 }}>{g.membersCount} участника</div>
              </div>
              <span style={{ color: C.border, fontSize: 20 }}>›</span>
            </div>
          ))}
        </Card>

        {archivedGroups.length > 0 && (
          <>
            <div
              onClick={() => setShowArchive(!showArchive)}
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, color: C.hint, fontSize: 14, cursor: 'pointer' }}
            >
              <span>📦 Архив ({archivedGroups.length})</span>
              <span style={{ fontSize: 12 }}>{showArchive ? '▲' : '▼'}</span>
            </div>
            {showArchive && (
              <Card>
                {archivedGroups.map((g, i) => (
                  <div key={g.id} style={{
                    padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12,
                    borderBottom: i < archivedGroups.length - 1 ? `0.5px solid ${C.border}` : 'none',
                    opacity: 0.7,
                  }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 14, background: C.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                    }}>{g.icon || '📁'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>{g.name}</div>
                      <div style={{ fontSize: 13, color: C.hint, marginTop: 2 }}>{g.membersCount} участника</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUnarchive(g.id); }}
                      style={{
                        padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.blue}`,
                        background: 'transparent', color: C.blue, fontSize: 13, cursor: 'pointer',
                      }}
                    >Восстановить</button>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

        <div style={{ padding: '16px 16px 8px', textAlign: 'center' }}>
          <a
            href="https://forms.gle/ix1a3PYK6XGqvADg7"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 13, color: C.hint, textDecoration: 'none' }}
          >
            Обратная связь: https://forms.gle/ix1a3PYK6XGqvADg7
          </a>
        </div>
      </div>

      <button onClick={() => navigate('/create-group')} style={{
        position: 'absolute', bottom: 26, right: 20,
        width: 56, height: 56, borderRadius: 28,
        background: C.blue, color: 'white', border: 'none',
        fontSize: 30, fontWeight: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', boxShadow: '0 4px 20px rgba(42,171,238,0.45)', zIndex: 50,
      }}>+</button>
    </div>
  );
};
