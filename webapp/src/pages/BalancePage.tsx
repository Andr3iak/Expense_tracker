// Экран балансов группы. Показывает, кто кому должен, позволяет запросить долг через Telegram.
// API возвращает баланс каждого участника (не попарные долги):
// отрицательный баланс = человек должен группе, положительный = группа должна ему.

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Card, SLabel, Av, Pill, Sheet, Btn, C } from '../components/ui';
import { useUser } from '../context/UserContext';
import { balancesApi, groupsApi } from '../utils/api';
import type { BalanceInfo, GroupDetail } from '../utils/api';
import { avatarColor, initials } from '../components/ui';
import { shareLink } from '../hooks';

interface DebtItem {
  userId: number;
  amount: number;
  userName: string;
}

export const BalancePage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [info, setInfo] = useState<BalanceInfo | null>(null);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  // sheet хранит выбранную строку долга для Bottom Sheet
  const [sheet, setSheet] = useState<DebtItem | null>(null);
  const [hidden, setHidden] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!groupId) return;
    Promise.all([
      balancesApi.getByGroup(groupId),
      groupsApi.getById(groupId),
    ]).then(([bal, g]) => {
      setInfo(bal);
      setGroup(g);
    });
  }, [groupId]);

  if (!info) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  const myId = user?.id;
  const myBalance = info.debts.find((d) => d.userId === myId)?.amount ?? 0;
  const net = info.total;

  const inDebt = info.debts.filter((d) => d.userId !== myId && d.amount < 0);
  const owed = info.debts.filter((d) => d.userId !== myId && d.amount > 0);

  const markPaid = (userId: number) => {
    setHidden((p) => new Set([...p, userId]));
    setSheet(null);
  };

  // Открывает Telegram share с текстом-напоминанием о долге
  const requestViaTelegram = (debt: DebtItem) => {
    const groupName = group?.name || 'группе расходов';
    const amount = Math.abs(debt.amount).toLocaleString('ru');
    const text = `${debt.userName}, ты должен ${amount} ₽ в ${groupName}`;
    const appUrl = window.location.origin;
    shareLink(appUrl, text);
    setSheet(null);
  };

  const visibleInDebt = inDebt.filter((d) => !hidden.has(d.userId));
  const visibleOwed = owed.filter((d) => !hidden.has(d.userId));
  const allClear = visibleInDebt.length === 0 && visibleOwed.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, position: 'relative' }}>
      <NavBar title="Баланс" onBack={() => navigate(`/group/${groupId}`)} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {/* Общая сумма расходов и личный баланс */}
        <div style={{ background: C.card, margin: '0 16px 16px', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: C.hint, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Итого по группе
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{net.toLocaleString('ru')} ₽</div>
          {myId && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 13, color: C.hint }}>Ваш баланс: </span>
              <Pill n={myBalance} />
            </div>
          )}
        </div>

        {visibleInDebt.length > 0 && (
          <>
            <SLabel>Они должны группе</SLabel>
            <Card>
              {visibleInDebt.map((d, i) => (
                <div key={d.userId} onClick={() => setSheet(d)} style={{
                  padding: '12px 16px',
                  borderBottom: i < visibleInDebt.length - 1 ? `0.5px solid ${C.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                }}>
                  <Av m={{ initials: initials(d.userName), color: avatarColor(d.userId) }} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{d.userName}</div>
                    <div style={{ fontSize: 12, color: C.hint }}>Нажмите для действий</div>
                  </div>
                  <div style={{ color: C.red, fontWeight: 700, fontSize: 16 }}>
                    {Math.abs(d.amount).toLocaleString('ru')} ₽
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}

        {visibleOwed.length > 0 && (
          <>
            <SLabel>Группа должна им</SLabel>
            <Card>
              {visibleOwed.map((d, i) => (
                <div key={d.userId} onClick={() => setSheet(d)} style={{
                  padding: '12px 16px',
                  borderBottom: i < visibleOwed.length - 1 ? `0.5px solid ${C.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                }}>
                  <Av m={{ initials: initials(d.userName), color: avatarColor(d.userId) }} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{d.userName}</div>
                    <div style={{ fontSize: 12, color: C.hint }}>Нажмите для действий</div>
                  </div>
                  <div style={{ color: C.green, fontWeight: 700, fontSize: 16 }}>
                    {d.amount.toLocaleString('ru')} ₽
                  </div>
                </div>
              ))}
            </Card>
          </>
        )}

        {allClear && (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Всё погашено!</div>
            <div style={{ color: C.hint, fontSize: 15 }}>Нет непогашенных долгов</div>
          </div>
        )}
      </div>

      <Sheet
        show={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet ? `${sheet.userName} · ${Math.abs(sheet.amount).toLocaleString('ru')} ₽` : ''}
      >
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn label="Отметить как оплачено" onTap={() => sheet && markPaid(sheet.userId)} />
          {/* Отправляет напоминание через Telegram share */}
          <div
            onClick={() => sheet && requestViaTelegram(sheet)}
            style={{
              background: '#F2F2F7', borderRadius: 12, padding: '13px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 18 }}>✈️</span>
            <span style={{ fontWeight: 500, fontSize: 15, color: C.text }}>Запросить через Telegram</span>
          </div>
          <button onClick={() => setSheet(null)} style={{
            background: 'none', border: 'none', color: C.hint, fontSize: 15,
            padding: 10, cursor: 'pointer', fontFamily: 'inherit',
          }}>Отмена</button>
        </div>
      </Sheet>
    </div>
  );
};
