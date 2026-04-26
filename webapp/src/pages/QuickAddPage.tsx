// Экран быстрого добавления расхода — минимальный UI для путешественников.
// Делит расход поровну между всеми участниками без дополнительных шагов.

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Btn, C } from '../components/ui';
import { groupsApi, expensesApi } from '../utils/api';
import type { GroupDetail } from '../utils/api';
import { avatarColor, initials } from '../components/ui';

const SUGGESTIONS = [
  { label: 'Море ✈', tag: 'travel' },
  { label: 'Такси 🚕', tag: 'transport' },
  { label: 'Продукты 🛒', tag: 'food' },
  { label: 'Обед 🍱', tag: 'food' },
  { label: 'Чай 🍵', tag: 'drinks' },
];

export const QuickAddPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [amount, setAmount] = useState('');
  const [tag, setTag] = useState('');
  const [who, setWho] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!groupId) return;
    groupsApi.getById(groupId).then((g) => {
      setGroup(g);
      if (g.members.length > 0) setWho(g.members[0].userId);
    });
  }, [groupId]);

  if (!group) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  const handleAdd = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0 || !who || !groupId) return;
    await expensesApi.create(groupId, {
      amount: n,
      description: tag || 'Быстрый расход',
      paidBy: who,
      participantIds: group.members.map((m) => m.userId),
    });
    setSuccess(true);
    // Сбрасываем форму через 1.8s и возвращаемся на экран группы
    setTimeout(() => navigate(`/group/${groupId}`), 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <NavBar title="Быстрый расход ⚡" onBack={() => navigate(`/group/${groupId}`)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 16px 16px', gap: 14 }}>
        {/* Большое поле ввода суммы */}
        <div style={{ background: C.card, borderRadius: 16, padding: '20px 20px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: C.hint, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
            Сумма
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ fontSize: 42, color: C.hint, fontWeight: 200 }}>₽</span>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              style={{
                border: 'none', outline: 'none', background: 'none',
                fontSize: 54, fontWeight: 200, color: amount ? C.text : C.hint,
                fontFamily: 'inherit', textAlign: 'center', width: 160,
              }}
            />
          </div>
        </div>

        {/* Теги-подсказки категорий */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SUGGESTIONS.map((s) => (
            <div key={s.tag + s.label} onClick={() => setTag(tag === s.label ? '' : s.label)} style={{
              background: tag === s.label ? C.blue : C.card,
              color: tag === s.label ? 'white' : C.text,
              borderRadius: 20, padding: '7px 14px', fontSize: 14,
              cursor: 'pointer', border: `1px solid ${tag === s.label ? C.blue : C.border}`,
              transition: 'all 0.15s',
            }}>{s.label}</div>
          ))}
        </div>

        {/* Горизонтальный список плательщиков */}
        <div style={{ background: C.card, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{
            padding: '10px 16px', borderBottom: `0.5px solid ${C.border}`,
            fontSize: 12, color: C.hint, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.6,
          }}>Кто платил</div>
          <div style={{ display: 'flex', padding: '12px 16px', gap: 12, overflowX: 'auto' }}>
            {group.members.map((m) => {
              const name = m.user.username || `User ${m.userId}`;
              const color = avatarColor(m.userId);
              const active = who === m.userId;
              return (
                <div key={m.id} onClick={() => setWho(m.userId)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  cursor: 'pointer', flexShrink: 0,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 21,
                    background: active ? color : C.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: active ? 'white' : C.hint,
                    fontWeight: 700, fontSize: 14,
                    border: `2.5px solid ${active ? color : C.border}`,
                    transition: 'all 0.15s',
                  }}>{initials(name)}</div>
                  <div style={{ fontSize: 11, color: active ? C.blue : C.hint, fontWeight: active ? 600 : 400 }}>
                    {name.split(' ')[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          {success ? (
            <div style={{
              background: C.green, borderRadius: 12, padding: 14,
              textAlign: 'center', color: 'white', fontWeight: 600, fontSize: 17,
            }}>✓ Добавлено!</div>
          ) : (
            <Btn label="Добавить" onTap={handleAdd} disabled={!amount || parseFloat(amount) <= 0} />
          )}
        </div>
      </div>
    </div>
  );
};
