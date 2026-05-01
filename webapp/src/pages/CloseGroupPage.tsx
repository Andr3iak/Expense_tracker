// Экран закрытия группы. Предупреждает о непогашенных долгах и показывает итоги участников.
// Закрытие группы реализовано только на фронтенде — в базе нет поля статуса.

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Card, SLabel, Av, Pill, Btn, C } from '../components/ui';
import { groupsApi, balancesApi } from '../utils/api';
import type { GroupDetail, BalanceInfo } from '../utils/api';
import { avatarColor, initials } from '../components/ui';
import { useUser } from '../context/UserContext';

export const CloseGroupPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [info, setInfo] = useState<BalanceInfo | null>(null);
  const [done, setDone] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (!groupId) return;
    Promise.all([groupsApi.getById(groupId), balancesApi.getByGroup(groupId)])
      .then(([g, b]) => { setGroup(g); setInfo(b); });
  }, [groupId]);

  if (done && group) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        background: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32,
      }}>
        <div style={{ fontSize: 72, marginBottom: 22 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>Группа закрыта</div>
        <div style={{ color: C.hint, fontSize: 15, textAlign: 'center', marginBottom: 36 }}>
          «{group.name}» перемещена в архив
        </div>
        <Btn label="На главную" onTap={() => navigate('/')} />
      </div>
    );
  }

  if (!group || !info) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  const hasDebts = info.debts.some((d) => Math.abs(d.amount) > 0.01);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <NavBar title="Закрытие группы" onBack={() => navigate(`/group/${groupId}`)} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 20px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{group.icon || '📁'}</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{group.name}</div>
          <div style={{ color: C.hint, fontSize: 14 }}>{group.members.length} участников</div>
        </div>

        {hasDebts ? (
          <div style={{ margin: '0 16px 12px', padding: '12px 16px', background: '#FFF3CD', borderRadius: 12, display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ fontSize: 14, color: '#856404', lineHeight: 1.4 }}>
              Есть непогашенные долги. Рекомендуем рассчитаться перед закрытием.
            </div>
          </div>
        ) : (
          <div style={{ margin: '0 16px 12px', padding: '14px 16px', background: '#D4EDDA', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>✅ Все долги погашены</div>
            <div style={{ fontSize: 14, color: '#155724' }}>Группу можно безопасно закрыть</div>
          </div>
        )}

        <SLabel>Балансы участников</SLabel>
        <Card>
          {info.debts.map((d, i) => (
            <div key={d.userId} style={{
              padding: '11px 16px',
              borderBottom: i < info.debts.length - 1 ? `0.5px solid ${C.border}` : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Av m={{ initials: initials(d.userName), color: avatarColor(d.userId) }} size={32} />
              <div style={{ flex: 1, fontWeight: 500 }}>{d.userName}</div>
              <Pill n={d.amount} />
            </div>
          ))}
        </Card>

        <div style={{ padding: 16 }}>
          <Btn label="Закрыть группу" onTap={async () => {
            if (user && groupId) {
              await groupsApi.archive(groupId, user.id);
            }
            setDone(true);
            }} danger />
        </div>
      </div>
    </div>
  );
};
