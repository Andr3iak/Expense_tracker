// Экран выбора способа разделения расхода между участниками.
// Получает данные расхода (сумма, описание, плательщик) через router state от AddExpensePage.

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { NavBar, Card, SLabel, Av, Btn, C } from '../components/ui';
import { groupsApi, expensesApi } from '../utils/api';
import type { GroupDetail } from '../utils/api';
import { avatarColor, initials } from '../components/ui';

interface ExpenseState {
  amount: number;
  description: string;
  paidBy: number;
}

export const SplitModePage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const exp = location.state as ExpenseState | null;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [mode, setMode] = useState<'equal' | 'selective' | 'percent'>('equal');
  // sel хранит id участников, выбранных в режиме "Выборочно"
  const [sel, setSel] = useState<number[]>([]);
  const [pcts, setPcts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    groupsApi.getById(groupId).then((g) => {
      setGroup(g);
      setSel(g.members.map((m) => m.userId));
      const eq = Math.round(100 / g.members.length);
      const init: Record<number, number> = {};
      g.members.forEach((m) => { init[m.userId] = eq; });
      setPcts(init);
    });
  }, [groupId]);

  if (!group || !exp) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  const activeIds = mode === 'equal' ? group.members.map((m) => m.userId) : sel;
  const perPerson = activeIds.length > 0 ? Math.ceil(exp.amount / activeIds.length) : 0;

  const toggleSel = (id: number) =>
    setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handleSubmit = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      await expensesApi.create(groupId, {
        amount: exp.amount,
        description: exp.description,
        paidBy: exp.paidBy,
        participantIds: activeIds,
      });
      navigate(`/group/${groupId}`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'equal', label: 'Поровну' },
    { id: 'selective', label: 'Выборочно' },
    { id: 'percent', label: 'По %' },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <NavBar title="Режим разделения" onBack={() => navigate(-1)} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {/* Переключатель режима разделения */}
        <div style={{ padding: '0 16px 14px' }}>
          <div style={{ background: C.card, borderRadius: 10, padding: 4, display: 'flex', gap: 4 }}>
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setMode(t.id)} style={{
                flex: 1, padding: '8px 4px',
                background: mode === t.id ? C.blue : 'transparent',
                color: mode === t.id ? 'white' : C.hint,
                border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        <Card mb={14}>
          <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: C.hint, marginBottom: 4 }}>Итого</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{exp.amount.toLocaleString('ru')} ₽</div>
            </div>
            {mode !== 'percent' && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: C.hint, marginBottom: 4 }}>На человека</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.blue }}>{perPerson.toLocaleString('ru')} ₽</div>
              </div>
            )}
          </div>
        </Card>

        <SLabel>{mode === 'selective' ? 'Выберите участников' : 'Участники'}</SLabel>
        <Card>
          {group.members.map((m, i) => {
            const name = m.user.username || `User ${m.userId}`;
            const isActive = mode === 'equal' || sel.includes(m.userId);
            return (
              <div key={m.id}
                onClick={() => mode === 'selective' && toggleSel(m.userId)}
                style={{
                  padding: '11px 16px',
                  borderBottom: i < group.members.length - 1 ? `0.5px solid ${C.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                  cursor: mode === 'selective' ? 'pointer' : 'default',
                  opacity: mode === 'selective' && !isActive ? 0.38 : 1,
                  transition: 'opacity 0.15s',
                }}>
                <Av m={{ initials: initials(name), color: avatarColor(m.userId) }} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{name}</div>
                  {mode !== 'percent' && (
                    <div style={{ fontSize: 13, color: C.hint, marginTop: 2 }}>
                      {isActive ? `${perPerson.toLocaleString('ru')} ₽` : '—'}
                    </div>
                  )}
                </div>

                {mode === 'selective' && (
                  <div style={{
                    width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${isActive ? C.blue : C.border}`,
                    background: isActive ? C.blue : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isActive && <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>}
                  </div>
                )}
                {mode === 'equal' && (
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, background: C.blue,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>✓</span>
                  </div>
                )}
                {mode === 'percent' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <input
                      type="number"
                      value={pcts[m.userId] || 0}
                      onChange={(e) => setPcts((p) => ({ ...p, [m.userId]: parseInt(e.target.value) || 0 }))}
                      style={{
                        width: 44, textAlign: 'right',
                        border: `1px solid ${C.border}`, outline: 'none',
                        borderRadius: 6, padding: '4px 6px', fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
                      }}
                    />
                    <span style={{ color: C.hint, fontSize: 15 }}>%</span>
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        <div style={{ padding: 16 }}>
          <Btn
            label="Добавить расход"
            onTap={handleSubmit}
            disabled={loading || (mode === 'selective' && sel.length === 0)}
          />
        </div>
      </div>
    </div>
  );
};
