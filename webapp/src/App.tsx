// Корневой компонент. Настраивает маршрутизацию для всех 10 экранов дизайна.

import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { UserProvider } from './context/UserContext';
import { useUser } from './context/UserContext';
import { groupsApi } from './utils/api';
import { getStartParam } from './hooks';
import {
  HomePage, GroupPage, AddExpensePage, CreateGroupPage,
  InviteMembersPage, SplitModePage, BalancePage,
  CloseGroupPage, DisputePage, QuickAddPage,
} from './pages';

// SAFE_TOP — отступ сверху для строки состояния / Dynamic Island на iOS.
const SAFE_TOP = 62;

// Обрабатывает deep link при открытии приложения через invite-ссылку.
// Параметр "join_GROUPID" добавляет текущего пользователя в группу и перенаправляет.
function StartParamHandler() {
  const navigate = useNavigate();
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    const param = getStartParam();
    if (param?.startsWith('join_')) {
      const groupId = param.slice(5);
      groupsApi.addMember(groupId, user.id)
        .then(() => navigate(`/group/${groupId}`, { replace: true }))
        .catch(() => {}); // группа может не существовать — тихо игнорируем
    }
    // Fallback для dev-среды: ?join=GROUPID в URL
    const urlJoin = new URLSearchParams(window.location.search).get('join');
    if (urlJoin) {
      groupsApi.addMember(urlJoin, user.id)
        .then(() => navigate(`/group/${urlJoin}`, { replace: true }))
        .catch(() => {});
    }
  }, [user?.id]);

  return null;
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <div style={{
          height: '100dvh',
          paddingTop: SAFE_TOP,
          display: 'flex',
          flexDirection: 'column',
          background: '#EFEFF4',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <StartParamHandler />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create-group" element={<CreateGroupPage />} />
            <Route path="/group/:groupId" element={<GroupPage />} />
            <Route path="/group/:groupId/members" element={<InviteMembersPage />} />
            <Route path="/group/:groupId/add-expense" element={<AddExpensePage />} />
            <Route path="/group/:groupId/split" element={<SplitModePage />} />
            <Route path="/group/:groupId/balance" element={<BalancePage />} />
            <Route path="/group/:groupId/close" element={<CloseGroupPage />} />
            <Route path="/group/:groupId/dispute/:expenseId" element={<DisputePage />} />
            <Route path="/group/:groupId/quick-add" element={<QuickAddPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
