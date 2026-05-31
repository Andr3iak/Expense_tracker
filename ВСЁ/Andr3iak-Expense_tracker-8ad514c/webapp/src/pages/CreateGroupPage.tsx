// Экран создания новой группы расходов.
// После создания переходит на экран приглашения участников.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Card, Btn, EmojiPicker, C } from '../components/ui';
import { useUser } from '../context/UserContext';
import { groupsApi } from '../utils/api';
import { hapticNotification } from '../hooks';

export const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    try {
      const group = await groupsApi.create({ name: name.trim(), icon: icon || undefined, userId: user.id });
      hapticNotification('success');
      navigate(`/group/${group.id}/members`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, position: 'relative' }}>
      <NavBar
        title="Новая группа"
        onBack={() => navigate('/')}
        backLabel="Отмена"
        rightLabel="Создать"
        onRight={name.trim() ? handleCreate : null}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0 16px' }}>
        {/* Круг выбора иконки группы — тап открывает EmojiPicker */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div
            onClick={() => setPickerOpen(true)}
            style={{
              width: 96, height: 96, borderRadius: 48,
              border: icon ? 'none' : `2px dashed ${C.border}`,
              background: icon ? C.card : C.card,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: icon ? 52 : 38, cursor: 'pointer',
              color: C.hint,
              boxShadow: icon ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {icon || '+'}
          </div>
        </div>

        <Card>
          <input
            placeholder="Название группы"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={{
              width: '100%', border: 'none', outline: 'none', padding: '13px 16px',
              fontSize: 16, background: 'none', color: C.text, fontFamily: 'inherit',
            }}
          />
        </Card>

        <div style={{ padding: '6px 20px', fontSize: 13, color: C.hint }}>
          Нажмите на круг, чтобы выбрать иконку группы
        </div>

        <div style={{ padding: '28px 16px 16px' }}>
          <Btn label="Создать группу" onTap={handleCreate} disabled={!name.trim() || loading} />
        </div>
      </div>

      <EmojiPicker show={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={setIcon} />
    </div>
  );
};
