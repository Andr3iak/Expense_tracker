import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { NavBar, Card, SLabel, Av, Btn, C } from '../components/ui';
import { groupsApi, expensesApi } from '../utils/api';
import type { GroupDetail, Category, Expense } from '../utils/api';
import { avatarColor, initials } from '../components/ui';
import { useBackButton, useMainButton, hapticImpact } from '../hooks';

export const AddExpensePage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  // При редактировании GroupPage передаёт { expense } в state
  const editingExpense = (location.state as { expense?: Expense } | null)?.expense ?? null;
  const isEditing = !!editingExpense;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [amount, setAmount] = useState(editingExpense ? String(editingExpense.amount) : '');
  const [description, setDescription] = useState(editingExpense?.description ?? '');
  const [category, setCategory] = useState(editingExpense?.category ?? 'other');
  const [paidBy, setPaidBy] = useState<number | null>(editingExpense?.paidBy ?? null);

  useEffect(() => {
    if (!groupId) return;
    Promise.all([
      groupsApi.getById(groupId),
      expensesApi.getCategories(),
    ]).then(([g, cats]) => {
      setGroup(g);
      setCategories(cats);
      if (!paidBy && g.members.length > 0) setPaidBy(g.members[0].userId);
    });
  }, [groupId]);

  const ok = !!amount && parseFloat(amount) > 0 && !!description.trim();

  const handleNext = useCallback(() => {
    if (!ok || !paidBy) return;
    hapticImpact('light');
    navigate(`/group/${groupId}/split`, {
      state: {
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        paidBy,
        // Передаём expenseId дальше — SplitModePage вызовет PATCH вместо POST
        expenseId: editingExpense?.id ?? null,
        // Предзаполняем участников для режима редактирования
        existingParticipantIds: editingExpense?.participants.map((p) => p.userId) ?? null,
      },
    });
  }, [ok, paidBy, amount, description, category, groupId, navigate, editingExpense]);

  useBackButton(() => navigate(`/group/${groupId}`));
  useMainButton(isEditing ? 'Сохранить →' : 'Далее →', handleNext, ok);

  if (!group) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <NavBar
        title={isEditing ? 'Редактирование расхода' : 'Добавление расхода'}
        onBack={() => navigate(`/group/${groupId}`)}
      />

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '16px 0' }}>
        <Card>
          <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.hint, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
              Сумма
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 34, color: C.hint, fontWeight: 200 }}>₽</span>
              <input
                type="number" placeholder="0" value={amount}
                onChange={(e) => setAmount(e.target.value)} autoFocus
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 40, fontWeight: 200, color: amount ? C.text : C.hint, background: 'none', fontFamily: 'inherit' }}
              />
            </div>
          </div>
          <input
            placeholder="За что" value={description} onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', padding: '12px 16px', fontSize: 16, background: 'none', color: C.text, fontFamily: 'inherit' }}
          />
        </Card>

        <SLabel>Категория</SLabel>
        <div style={{ padding: '0 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                background: category === cat.id ? C.blue : C.card,
                color: category === cat.id ? 'white' : C.text,
                border: `1px solid ${category === cat.id ? C.blue : C.border}`,
                borderRadius: 20, padding: '7px 14px', fontSize: 14,
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>

        <SLabel>Кто заплатил</SLabel>
        <Card>
          {group.members.map((m, i) => {
            const name = m.user.firstName || m.user.username || `User ${m.userId}`;
            const isSelected = paidBy === m.userId;
            return (
              <div key={m.id} onClick={() => setPaidBy(m.userId)} style={{
                padding: '11px 16px',
                borderBottom: i < group.members.length - 1 ? `0.5px solid ${C.border}` : 'none',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              }}>
                <Av m={{ initials: initials(name), color: avatarColor(m.userId) }} size={34} />
                <div style={{ flex: 1, fontWeight: 500 }}>{name}</div>
                <div style={{
                  width: 22, height: 22, borderRadius: 11,
                  border: `2px solid ${isSelected ? C.blue : C.border}`,
                  background: isSelected ? C.blue : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {isSelected && <div style={{ width: 8, height: 8, borderRadius: 4, background: 'white' }} />}
                </div>
              </div>
            );
          })}
        </Card>

        <div style={{ padding: 16 }}>
          <Btn label={isEditing ? 'Сохранить →' : 'Далее →'} onTap={handleNext} disabled={!ok} />
        </div>
      </div>
    </div>
  );
};
