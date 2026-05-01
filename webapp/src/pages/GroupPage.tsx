import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { NavBar, Card, SLabel, Av, Pill, EmojiIcon, Sheet, EmojiPicker, Btn, C } from '../components/ui';
import { useUser } from '../context/UserContext';
import { groupsApi, expensesApi, balancesApi } from '../utils/api';
import type { Expense, BalanceInfo, GroupDetail } from '../utils/api';
import { avatarColor, initials } from '../components/ui';
import { hapticNotification } from '../hooks';

function memberDisplayName(user: { username: string | null; firstName: string | null }, userId: number): string {
  return user.firstName || user.username || `User ${userId}`;
}

export const GroupPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo>({ total: 0, debts: [], balances: [], transactions: [] });
  const [q, setQ] = useState('');

  const [editSheet, setEditSheet] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);

  const loadAll = useCallback(() => {
    if (!groupId) return;
    Promise.all([
      groupsApi.getById(groupId),
      expensesApi.getByGroup(groupId),
      balancesApi.getByGroup(groupId),
    ]).then(([g, exps, bal]) => {
      setGroup(g);
      setExpenses(exps);
      setBalanceInfo(bal);
    });
  }, [groupId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (!group) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  const myBalance = balanceInfo.debts.find((d) => d.userId === user?.id)?.amount ?? 0;
  const filtered = group.members.filter((m) => {
    const name = memberDisplayName(m.user, m.userId);
    return name.toLowerCase().includes(q.toLowerCase());
  });

  const openEdit = () => {
    setEditName(group.name);
    setEditIcon(group.icon || '');
    setEditSheet(true);
  };

  const saveEdit = async () => {
    if (!groupId || !user || !editName.trim()) return;
    await groupsApi.update(groupId, { name: editName.trim(), icon: editIcon || undefined, userId: user.id });
    hapticNotification('success');
    setEditSheet(false);
    loadAll();
  };

  const handleArchive = async () => {
    if (!groupId || !user) return;
    if (!window.confirm('Переместить группу в архив?')) return;
    await groupsApi.archive(groupId, user.id).catch(() => alert('Ошибка при архивировании'));
    navigate('/');
  };

  const handleDelete = async () => {
    if (!groupId || !user) return;
    if (!window.confirm('Удалить группу навсегда? Все расходы и участники будут удалены.')) return;
    await groupsApi.delete(groupId, user.id).catch(() => alert('Ошибка при удалении'));
    navigate('/');
  };

  const handleCopyInvite = () => {
    const botUsername = import.meta.env.VITE_BOT_USERNAME ?? 'Ex3penseTracker_bot';
    const appShortName = import.meta.env.VITE_APP_SHORT_NAME ?? 'app';
    const link = `https://t.me/${botUsername}/${appShortName}?startapp=${groupId}`;
    navigator.clipboard.writeText(link).then(() => alert('Ссылка скопирована!'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, position: 'relative' }}>
      <NavBar title={group.name} onBack={() => navigate('/')} rightLabel="⚙️" onRight={openEdit} />

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 80 }}>
        {/* Hero-блок с балансом текущего пользователя */}
        <div style={{
          background: C.card, padding: '22px 20px 18px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          borderBottom: `0.5px solid ${C.sep}`, marginBottom: 4,
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>{group.icon || '📁'}</div>
          <div style={{ fontSize: 13, color: C.hint, marginBottom: 4 }}>Ваш баланс</div>
          <Pill n={myBalance} large />
        </div>

        {/* Блок долгов (если есть) */}
        {balanceInfo.transactions.length > 0 && (
          <div
            onClick={() => navigate(`/group/${groupId}/balance`)}
            style={{
              margin: '8px 16px', padding: '12px 14px',
              background: C.card, borderRadius: 12, cursor: 'pointer',
              border: `0.5px solid ${C.border}`,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>💸 Кто кому должен</div>
            {balanceInfo.transactions.slice(0, 3).map((t, i) => (
              <div key={i} style={{ fontSize: 13, color: C.hint, marginTop: 2 }}>
                {t.fromName} → {t.toName}: {t.amount} ₽
              </div>
            ))}
            <div style={{ fontSize: 12, color: C.blue, marginTop: 6 }}>Подробнее →</div>
          </div>
        )}

        {/* Поиск по участникам */}
        <div style={{ padding: '8px 16px' }}>
          <div style={{ background: C.card, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.hint, fontSize: 15 }}>🔍</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени"
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, background: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>

        <SLabel>Участники</SLabel>
        <Card>
          {filtered.map((m) => {
            const name = memberDisplayName(m.user, m.userId);
            const memberBalance = balanceInfo.debts.find((d) => d.userId === m.userId)?.amount ?? 0;
            return (
              <div key={m.id} style={{
                padding: '11px 16px', borderBottom: `0.5px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <Av m={{ initials: initials(name), color: avatarColor(m.userId) }} size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{name}{m.userId === user?.id ? ' (вы)' : ''}</div>
                </div>
                <Pill n={memberBalance} />
              </div>
            );
          })}
          <div onClick={() => navigate(`/group/${groupId}/members`)} style={{
            padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18, background: C.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blue, fontSize: 20,
            }}>+</div>
            <div style={{ color: C.blue, fontWeight: 500, fontSize: 15 }}>Пригласить участника</div>
          </div>
        </Card>

        <SLabel>Расходы</SLabel>
        <Card>
          {expenses.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: C.hint, fontSize: 14 }}>
              Расходов пока нет. Добавьте первый!
            </div>
          )}
          {expenses.map((e, i) => (
            <div key={e.id}
              onClick={() => navigate(`/group/${groupId}/dispute`, { state: e })}
              style={{
                padding: '12px 16px',
                borderBottom: i < expenses.length - 1 ? `0.5px solid ${C.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: C.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
              }}><EmojiIcon cat={e.category || 'other'} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{e.description}</div>
                <div style={{ fontSize: 12, color: C.hint }}>
                  {new Date(e.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 600 }}>{e.amount.toLocaleString('ru')} ₽</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Нижняя панель навигации с FAB по центру */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', borderTop: `0.5px solid ${C.sep}`,
        padding: '10px 24px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 50,
      }}>
        {[
          { icon: '💰', label: 'Баланс',  tap: () => navigate(`/group/${groupId}/balance`) },
          { icon: '⚡', label: 'Быстро',  tap: () => navigate(`/group/${groupId}/quick-add`) },
          { fab: true,                     tap: () => navigate(`/group/${groupId}/add-expense`) },
          { icon: '🔒', label: 'Закрыть', tap: () => navigate(`/group/${groupId}/close`) },
          { icon: '💬', label: 'Чат',     tap: () => {} },
        ].map((b, i) =>
          b.fab ? (
            <button key={i} onClick={b.tap} style={{
              background: C.blue, border: 'none', borderRadius: 28, width: 52, height: 52,
              color: 'white', fontSize: 28, fontWeight: 200,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(42,171,238,0.4)',
            }}>+</button>
          ) : (
            <button key={i} onClick={b.tap} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: C.hint,
            }}>
              <span style={{ fontSize: 22 }}>{b.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 500 }}>{b.label}</span>
            </button>
          )
        )}
      </div>

      {/* Шит настроек группы */}
      <Sheet show={editSheet} onClose={() => setEditSheet(false)} title="Настройки группы">
        <div style={{ padding: '0 20px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div onClick={() => setEmojiOpen(true)} style={{
              width: 72, height: 72, borderRadius: 36, background: C.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: editIcon ? 40 : 28, cursor: 'pointer', color: C.hint,
            }}>{editIcon || '+'}</div>
          </div>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Название группы"
            style={{
              border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px',
              fontSize: 16, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <Btn label="Сохранить" onTap={saveEdit} disabled={!editName.trim()} />

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCopyInvite} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`,
              background: 'transparent', color: C.blue, fontSize: 14, cursor: 'pointer',
            }}>🔗 Пригласить</button>
          </div>

          <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 14, display: 'flex', gap: 8 }}>
            <button onClick={() => { setEditSheet(false); handleArchive(); }} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${C.border}`,
              background: 'transparent', color: C.hint, fontSize: 14, cursor: 'pointer',
            }}>📦 Архивировать</button>
            <button onClick={() => { setEditSheet(false); handleDelete(); }} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #FF3B30',
              background: 'transparent', color: '#FF3B30', fontSize: 14, cursor: 'pointer',
            }}>🗑 Удалить</button>
          </div>
        </div>
      </Sheet>

      <EmojiPicker show={emojiOpen} onClose={() => setEmojiOpen(false)} onSelect={setEditIcon} />
    </div>
  );
};
