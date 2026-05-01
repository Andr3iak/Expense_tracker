import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, SLabel, C } from '../components/ui';
import { useUser } from '../context/UserContext';
import { groupsApi } from '../utils/api';
import type { Group } from '../utils/api';

export const HomePage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [archivedGroups, setArchivedGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);

  const loadGroups = async () => {
    if (!user) return;
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

  const handleUnarchive = async (groupId: string) => {
    if (!user) return;
    await groupsApi.unarchive(groupId, user.id).catch(() => {});
    loadGroups();
  };

  const displayName = user?.username || 'User';
  const av = displayName.slice(0, 2).toUpperCase();

  if (loading) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, position: 'relative' }}>
      {/* Профиль пользователя */}
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
              style={{
                padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
                color: C.hint, fontSize: 14, cursor: 'pointer',
              }}
            >
              <span>📦 Архив ({archivedGroups.length})</span>
              <span style={{ fontSize: 12 }}>{showArchive ? '▲' : '▼'}</span>
            </div>

            {showArchive && (
              <Card>
                {archivedGroups.map((g, i) => (
                  <div key={g.id}
                    style={{
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
      </div>

      {/* FAB — кнопка создания группы */}
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
