// Экран добавления расхода. Собирает сумму, описание и плательщика,
// затем передаёт данные на экран SplitMode через router state.

import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { NavBar, Card, SLabel, Av, Btn, C } from '../components/ui';
import { groupsApi } from '../utils/api';
import type { GroupDetail } from '../utils/api';
import { avatarColor, initials } from '../components/ui';
import { useBackButton, useMainButton, hapticImpact } from '../hooks';

export const AddExpensePage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [desc, setDesc] = useState('');
  // paidBy — userId плательщика, по умолчанию первый участник группы
  const [paidBy, setPaidBy] = useState<number | null>(null);

  useEffect(() => {
    if (!groupId) return;
    groupsApi.getById(groupId).then((g) => {
      setGroup(g);
      if (g.members.length > 0) setPaidBy(g.members[0].userId);
    });
  }, [groupId]);

  if (!group) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  const ok = !!amount && parseFloat(amount) > 0 && !!description.trim();

  const handleNext = useCallback(() => {
    if (!ok || !paidBy) return;
    hapticImpact('light');
    // Данные расхода передаются через state, чтобы не загрязнять URL
    navigate(`/group/${groupId}/split`, {
      state: { amount: parseFloat(amount), description: description.trim(), paidBy },
    });
  }, [ok, paidBy, amount, description, groupId]);

  useBackButton(() => navigate(`/group/${groupId}`));
  useMainButton('Далее →', handleNext, ok);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <NavBar title="Добавление расхода" onBack={() => navigate(`/group/${groupId}`)} />

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '16px 0' }}>
        {/* Поля: сумма, за что, описание в одной карточке */}
        <Card>
          <div style={{ padding: '14px 16px', borderBottom: `0.5px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.hint, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
              Сумма
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 34, color: C.hint, fontWeight: 200 }}>₽</span>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 40, fontWeight: 200, color: amount ? C.text : C.hint,
                  background: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
          </div>
          <div style={{ borderBottom: `0.5px solid ${C.border}` }}>
            <input
              placeholder="За что"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%', border: 'none', outline: 'none',
                padding: '12px 16px', fontSize: 16, background: 'none', color: C.text, fontFamily: 'inherit',
              }}
            />
          </div>
          <input
            placeholder="Описание (необязательно)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{
              width: '100%', border: 'none', outline: 'none',
              padding: '12px 16px', fontSize: 16, background: 'none', color: C.text, fontFamily: 'inherit',
            }}
          />
        </Card>

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
                {/* Radio-индикатор выбора плательщика */}
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

        <div style={{ padding: '6px 16px' }}>
          <div style={{
            background: C.card, borderRadius: 12, padding: '13px 16px',
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: C.blue,
          }}>
            <span style={{ fontSize: 20 }}>📎</span>
            <span style={{ fontWeight: 500, fontSize: 15 }}>Прикрепить чек</span>
          </div>
        </div>

        <div style={{ padding: '12px 16px' }}>
          <Btn label="Далее →" onTap={handleNext} disabled={!ok} />
        </div>
      </div>
    </div>
  );
};
