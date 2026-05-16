import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Card, SLabel, Av, Pill, Sheet, Btn, C } from '../components/ui';
import { useUser } from '../context/UserContext';
import { balancesApi, groupsApi } from '../utils/api';
import type { BalanceInfo, GroupDetail } from '../utils/api';
import { avatarColor, initials } from '../components/ui';
import { shareLink } from '../hooks';

// Транзакция — минимальная единица долга между двумя конкретными людьми
interface TxItem {
  from: number;
  to: number;
  amount: number;
  fromName: string;
  toName: string;
}

export const BalancePage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const [info, setInfo] = useState<BalanceInfo | null>(null);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [sheet, setSheet] = useState<TxItem | null>(null);
  const [settling, setSettling] = useState(false);

  const load = useCallback(() => {
    if (!groupId) return;
    Promise.all([
      balancesApi.getByGroup(groupId),
      groupsApi.getById(groupId),
    ]).then(([bal, g]) => {
      setInfo(bal);
      setGroup(g);
    });
  }, [groupId]);

  useEffect(() => { load(); }, [load]);

  if (!info) return <div style={{ padding: 20, color: C.hint }}>Загрузка...</div>;

  const myId = user?.id;
  const myBalance = info.debts.find((d) => d.userId === myId)?.amount ?? 0;

  // Записываем оплату в базу — после этого перезагружаем балансы,
  // чтобы цифры обновились без перезахода на страницу
  const markPaid = async (tx: TxItem) => {
    if (!groupId || settling) return;
    setSettling(true);
    try {
      await balancesApi.createSettlement(groupId, tx.from, tx.to, tx.amount);
      setSheet(null);
      load();
    } finally {
      setSettling(false);
    }
  };

  const requestViaTelegram = (tx: TxItem) => {
    const groupName = group?.name || 'группе расходов';
    const text = `${tx.fromName}, ты должен ${tx.amount.toLocaleString('ru')} ₽ → ${tx.toName} (${groupName})`;
    shareLink(window.location.origin, text);
    setSheet(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, position: 'relative' }}>
      <NavBar title="Баланс" onBack={() => navigate(`/group/${groupId}`)} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        <div style={{ background: C.card, margin: '0 16px 16px', borderRadius: 16, padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: C.hint, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Итого по группе
          </div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{info.total.toLocaleString('ru')} ₽</div>
          {myId && (
            <div style={{ marginTop: 8 }}>
              <span style={{ fontSize: 13, color: C.hint }}>Ваш баланс: </span>
              <Pill n={myBalance} />
            </div>
          )}
        </div>

        {info.transactions.length > 0 ? (
          <>
            <SLabel>Кто кому должен</SLabel>
            <Card>
              {info.transactions.map((tx, i) => (
                <div key={i} onClick={() => setSheet(tx)} style={{
                  padding: '12px 16px',
                  borderBottom: i < info.transactions.length - 1 ? `0.5px solid ${C.border}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                }}>
                  <Av m={{ initials: initials(tx.fromName), color: avatarColor(tx.from) }} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>
                      {tx.fromName} <span style={{ color: C.hint, fontWeight: 400 }}>→</span> {tx.toName}
                    </div>
                    <div style={{ fontSize: 12, color: C.hint }}>Нажмите для действий</div>
                  </div>
                  <div style={{ color: C.red, fontWeight: 700, fontSize: 16 }}>
                    {tx.amount.toLocaleString('ru')} ₽
                  </div>
                </div>
              ))}
            </Card>
          </>
        ) : (
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
        title={sheet ? `${sheet.fromName} → ${sheet.toName} · ${sheet.amount.toLocaleString('ru')} ₽` : ''}
      >
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn
            label={settling ? 'Сохранение...' : 'Отметить как оплачено'}
            onTap={() => sheet && markPaid(sheet)}
            disabled={settling}
          />
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
