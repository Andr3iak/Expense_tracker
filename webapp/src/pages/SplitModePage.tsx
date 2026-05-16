import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { NavBar, Card, SLabel, Av, Btn, C } from '../components/ui';
import { groupsApi, expensesApi } from '../utils/api';
import type { GroupDetail } from '../utils/api';
import { avatarColor, initials } from '../components/ui';
import { useBackButton, useMainButton, hapticNotification, hapticImpact } from '../hooks';

interface ExpenseState {
  amount: number;
  description: string;
  paidBy: number;
  category: string;
  // Заполняются при редактировании существующего расхода
  expenseId?: string | null;
  existingParticipantIds?: number[] | null;
}

export const SplitModePage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const exp = location.state as ExpenseState | null;
  const isEditing = !!exp?.expenseId;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [mode, setMode] = useState<'equal' | 'selective' | 'percent'>('equal');
  const [sel, setSel] = useState<number[]>([]);
  const [pcts, setPcts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    groupsApi.getById(groupId).then((g) => {
      setGroup(g);
      // При редактировании предзаполняем участников из существующего расхода
      const initialSel = exp?.existingParticipantIds ?? g.members.map((m) => m.userId);
      setSel(initialSel);
      const eq = Math.round(100 / g.members.length);
      const init: Record<number, number> = {};
      g.members.forEach((m) => { init[m.userId] = eq; });
      setPcts(init);
    });
  }, [groupId]);

  const activeIds = group
    ? (mode === 'equal' ? group.members.map((m) => m.userId) : sel)
    : [];

  const perPerson = activeIds.length > 0 && exp
    ? Math.ceil(exp.amount / activeIds.length)
    : 0;

  const toggleSel = (id: number) =>
    setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handleSubmit = useCallback(async () => {
    if (!groupId || loading || !exp) return;
    setLoading(true);
    try {
      if (isEditing && exp.expenseId) {
        // Редактирование — обновляем существующий расход через PATCH
        await expensesApi.update(groupId, exp.expenseId, {
          amount: exp.amount,
          description: exp.description,
          category: exp.category,
          paidBy: exp.paidBy,
          participantIds: activeIds,
        });
      } else {
        await expensesApi.create(groupId, {
          amount: exp.amount,
          description: exp.description,
          category: exp.category,
          paidBy: exp.paidBy,
          participantIds: activeIds,
        });
      }
      hapticNotification('success');
      navigate(`/group/${groupId}`);
    } finally {
      setLoading(false);
    }
  }, [groupId, loading, activeIds, exp, isEditing, navigate]);

  const canSubmit = !loading && (mode !== 'selective' || sel.length > 0);

  // Хуки ВСЕГДА до любого return
  useBackButton(() => navigate(-1));
  useMainButton(isEditing ? 'Сохранить изменения' : 'Добавить расход', handleSubmit, canSubmit);

  if (!group || !exp) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  const tabs = [
    { id: 'equal', label: 'Поровну' },
    { id: 'selective', label: 'Выборочно' },
    { id: 'percent', label: 'По %' },
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <NavBar title="Режим разделения" onBack={() => navigate(-1)} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
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
            const name = m.user.firstName || m.user.username || `User ${m.userId}`;
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
            label={isEditing ? 'Сохранить изменения' : 'Добавить расход'}
            onTap={() => { hapticImpact('medium'); handleSubmit(); }}
            disabled={!canSubmit}
          />
        </div>
      </div>
    </div>
  );
};