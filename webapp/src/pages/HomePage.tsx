// Главный экран — список активных групп пользователя.
// Баланс в группе всегда 0 из API (считается отдельным эндпоинтом), поэтому не показываем.

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    groupsApi.getAll(user.id).then((data) => {
      setGroups(data);
      setLoading(false);
    });
  }, [user?.id]);

  // Приоритет имени: firstName (из Telegram) → username → fallback
  const displayName = user?.firstName || user?.username || 'User';
  const av = displayName.slice(0, 2).toUpperCase();

  if (loading) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, position: 'relative' }}>
      {/* Профиль пользователя вверху */}
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
