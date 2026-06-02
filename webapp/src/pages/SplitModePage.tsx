import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { NavBar, Card, SLabel, Av, Btn, C } from '../components/ui';
import { groupsApi, expensesApi } from '../utils/api';
import type { GroupDetail } from '../utils/api';
import { avatarColor, initials } from '../components/ui';
import { useBackButton, useMainButton, hapticNotification, hapticImpact } from '../hooks';
import { useUser } from '../context/UserContext';

interface ExpenseState {
  amount: number;
  description: string;
  category: string;
  paidBy: number;
  expenseId?: string | null;
  existingParticipantIds?: number[] | null;
}

export const SplitModePage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const exp = location.state as ExpenseState | null;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [mode, setMode] = useState<'equal' | 'selective' | 'percent'>('equal');
  const [sel, setSel] = useState<number[]>([]);
  const [pcts, setPcts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId || !user) return;
    groupsApi.getById(groupId).then((g) => {
      setGroup(g);
      const preselected = exp?.existingParticipantIds ?? g.members.map((m) => m.userId);
      setSel(preselected);
      const eq = Math.round(100 / g.members.length);
      const init: Record<number, number> = {};
      g.members.forEach((m) => { init[m.userId] = eq; });
      setPcts(init);
    }).catch((err) => {
      console.error('Ошибка загрузки группы:', err);
    });
  }, [groupId, user]);

  const activeIds = group
    ? (mode === 'equal' ? group.members.map((m) => m.userId) : sel)
    : [];

  const perPerson = activeIds.length > 0 && exp
    ? Math.ceil(exp.amount / activeIds.length)
    : 0;

  // Считаем сумму процентов для валидации
  const totalPct = Object.values(pcts).reduce((sum, v) => sum + v, 0);
  const pctValid = totalPct === 100;

  // Для каждого участника считаем сумму по его проценту
  const pctAmounts: Record<number, number> = {};
  if (group && exp) {
    let distributed = 0;
    const members = group.members;
    members.forEach((m, i) => {
      const pct = pcts[m.userId] ?? 0;
      if (i === members.length - 1) {
        // Последний участник получает остаток — избегаем копеек из-за округления
        pctAmounts[m.userId] = Math.round((exp.amount - distributed) * 100) / 100;
      } else {
        const amt = Math.round((exp.amount * pct) / 100 * 100) / 100;
        pctAmounts[m.userId] = amt;
        distributed += amt;
      }
    });
  }

  const toggleSel = (id: number) =>
    setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handlePctChange = (userId: number, value: string) => {
    const num = Math.max(0, Math.min(100, parseInt(value) || 0));
    setPcts((p) => ({ ...p, [userId]: num }));
  };

  const handleSubmit = useCallback(async () => {
    if (!groupId || loading || !exp) return;

    if (mode === 'percent' && !pctValid) return;

    setLoading(true);
    try {
      const isEditing = !!exp.expenseId;
      const baseData = {
        amount: exp.amount,
        description: exp.description,
        category: exp.category,
        paidBy: exp.paidBy,
      };

      if (mode === 'percent' && group) {
        const participantIds = group.members
          .filter((m) => (pcts[m.userId] ?? 0) > 0)
          .map((m) => m.userId);
        const splits = group.members
          .filter((m) => (pcts[m.userId] ?? 0) > 0)
          .map((m) => ({ userId: m.userId, percent: pcts[m.userId] ?? 0 }));

        if (isEditing) {
          await expensesApi.update(groupId, exp.expenseId!, { ...baseData, participantIds, splits });
        } else {
          await expensesApi.create(groupId, { ...baseData, participantIds, splits });
        }
      } else {
        if (isEditing) {
          await expensesApi.update(groupId, exp.expenseId!, { ...baseData, participantIds: activeIds });
        } else {
          await expensesApi.create(groupId, { ...baseData, participantIds: activeIds });
        }
      }
      hapticNotification('success');
      navigate(`/group/${groupId}`);
    } finally {
      setLoading(false);
    }
  }, [groupId, loading, activeIds, exp, mode, pcts, pctValid, group, navigate]);

  const canSubmit = !loading
    && (mode !== 'selective' || sel.length > 0)
    && (mode !== 'percent' || pctValid);

  useBackButton(() => navigate(-1));
  useMainButton('Добавить расход', handleSubmit, canSubmit);

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
        {/* Переключатель */}
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

        {/* Итого */}
        <Card mb={14}>
          <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: C.hint, marginBottom: 4 }}>Итого</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{exp.amount.toLocaleString('ru')} ₽</div>
            </div>
            {mode === 'percent' ? (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: C.hint, marginBottom: 4 }}>Сумма %</div>
                <div style={{
                  fontSize: 24, fontWeight: 700,
                  color: pctValid ? C.green : C.red,
                }}>
                  {totalPct}%
                </div>
                {!pctValid && (
                  <div style={{ fontSize: 11, color: C.red, marginTop: 2 }}>
                    {totalPct < 100 ? `не хватает ${100 - totalPct}%` : `лишних ${totalPct - 100}%`}
                  </div>
                )}
              </div>
            ) : (
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
            const pct = pcts[m.userId] ?? 0;
            const pctAmt = pctAmounts[m.userId] ?? 0;

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
                  <div style={{ fontSize: 13, color: C.hint, marginTop: 2 }}>
                    {mode === 'equal' && `${perPerson.toLocaleString('ru')} ₽`}
                    {mode === 'selective' && (isActive ? `${perPerson.toLocaleString('ru')} ₽` : '—')}
                    {mode === 'percent' && pct > 0 && `${pctAmt.toLocaleString('ru')} ₽`}
                  </div>
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
                      min={0}
                      max={100}
                      value={pct === 0 ? '' : pct}
                      placeholder="0"
                      onChange={(e) => handlePctChange(m.userId, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: 48, textAlign: 'right',
                        border: `1.5px solid ${pct > 0 ? C.blue : C.border}`,
                        outline: 'none', borderRadius: 6,
                        padding: '4px 6px', fontSize: 15, fontWeight: 600,
                        fontFamily: 'inherit', background: 'transparent',
                        color: C.text,
                      }}
                    />
                    <span style={{ color: C.hint, fontSize: 15 }}>%</span>
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        {/* Подсказка для режима % */}
        {mode === 'percent' && !pctValid && (
          <div style={{ padding: '8px 20px', fontSize: 13, color: C.red, textAlign: 'center' }}>
            Сумма процентов должна быть равна 100%
          </div>
        )}

        <div style={{ padding: 16 }}>
          <Btn
            label={loading ? 'Сохранение...' : 'Добавить расход'}
            onTap={() => { hapticImpact('medium'); handleSubmit(); }}
            disabled={!canSubmit}
          />
        </div>
      </div>
    </div>
  );
};