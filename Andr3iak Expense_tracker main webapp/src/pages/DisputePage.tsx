// Экран оспаривания расхода. Полностью фронтендный — API для споров не реализовано.
// Данные расхода передаются через router state от GroupPage.

import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { NavBar, Card, SLabel, EmojiIcon, Btn, C } from '../components/ui';
import type { Expense } from '../utils/api';

export const DisputePage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const exp = location.state as Expense | null;

  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [sent, setSent] = useState(false);

  const reasons = [
    'Неверная сумма',
    'Я не участвовал',
    'Дублирование расхода',
    'Неверный плательщик',
    'Другая причина',
  ];

  if (!exp) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
        <NavBar title="Спор по расходу" onBack={() => navigate(`/group/${groupId}`)} />
        <div style={{ padding: 20, color: C.hint }}>Расход не найден</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg }}>
      <NavBar title="Спор по расходу" onBack={() => navigate(`/group/${groupId}`)} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {/* Карточка с деталями оспариваемого расхода */}
        <Card>
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: C.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                <EmojiIcon cat="other" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{exp.description}</div>
                <div style={{ fontSize: 13, color: C.hint }}>
                  {new Date(exp.date).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>{exp.amount.toLocaleString('ru')} ₽</div>
          </div>
        </Card>

        {sent ? (
          <div style={{ padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>⚡</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Спор открыт</div>
            <div style={{ color: C.hint, fontSize: 14, lineHeight: 1.5 }}>
              Участники получили уведомление о споре. Ожидайте ответа.
            </div>
          </div>
        ) : (
          <>
            <SLabel>Причина</SLabel>
            <Card>
              {reasons.map((r, i) => (
                <div key={r} onClick={() => setReason(r)} style={{
                  padding: '12px 16px',
                  borderBottom: i < reasons.length - 1 ? `0.5px solid ${C.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                }}>
                  <div style={{ flex: 1, fontSize: 15 }}>{r}</div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                    border: `2px solid ${reason === r ? C.blue : C.border}`,
                    background: reason === r ? C.blue : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {reason === r && <div style={{ width: 8, height: 8, borderRadius: 4, background: 'white' }} />}
                  </div>
                </div>
              ))}
            </Card>

            <SLabel>Комментарий</SLabel>
            <Card>
              <textarea
                placeholder="Опишите ситуацию подробнее..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  padding: '12px 16px', fontSize: 15, color: C.text,
                  fontFamily: 'inherit', background: 'transparent', minHeight: 80,
                }}
              />
            </Card>

            <div style={{ padding: 16 }}>
              <Btn label="Отправить спор" onTap={() => setSent(true)} disabled={!reason} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
