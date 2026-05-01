import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { useEffect } from 'react';
import {
  HomePage, GroupPage, AddExpensePage, CreateGroupPage,
  InviteMembersPage, SplitModePage, BalancePage, CloseGroupPage,
  DisputePage, QuickAddPage,
} from './pages';
import { ThemeProvider } from './components/ThemeProvider';
import { UserProvider } from './context/UserContext';
import { useUser } from './context/UserContext';
import { groupsApi } from './utils/api';

function InviteHandler() {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    // Способ 1: Telegram Mini App startapp параметр (приоритет)
    const tg = (window as any).Telegram?.WebApp;
    const startParam: string | undefined = tg?.initDataUnsafe?.start_param;

    // Способ 2: URL параметр ?join=<groupId> (для браузера и прямых ссылок)
    const urlParams = new URLSearchParams(location.search);
    const joinParam = urlParams.get('join');

    // Способ 3: ?startapp=<groupId>
    const startappParam = urlParams.get('startapp');

    const rawGroupId = startParam || joinParam || startappParam;
    if (!rawGroupId) return;

    // Поддерживаем форматы: "join_<groupId>" и просто "<groupId>"
    const groupId = rawGroupId.startsWith('join_')
      ? rawGroupId.slice(5)
      : rawGroupId;

    groupsApi
      .join(groupId, {
        telegramId: user.telegramId,
        username: tg?.initDataUnsafe?.user?.username ?? user.username ?? undefined,
      })
      .then(() => navigate(`/group/${groupId}`, { replace: true }))
      .catch(() => navigate(`/group/${groupId}`, { replace: true }));
  }, [user?.id]);

  return null;
}

function App() {
  return (
    <AppRoot>
      <ThemeProvider>
        <UserProvider>
          <BrowserRouter>
            <InviteHandler />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/group/:groupId" element={<GroupPage />} />
              <Route path="/group/:groupId/add-expense" element={<AddExpensePage />} />
              <Route path="/group/:groupId/split" element={<SplitModePage />} />
              <Route path="/group/:groupId/members" element={<InviteMembersPage />} />
              <Route path="/group/:groupId/balance" element={<BalancePage />} />
              <Route path="/group/:groupId/close" element={<CloseGroupPage />} />
              <Route path="/group/:groupId/dispute" element={<DisputePage />} />
              <Route path="/group/:groupId/quick-add" element={<QuickAddPage />} />
              <Route path="/create-group" element={<CreateGroupPage />} />
            </Routes>
          </BrowserRouter>
        </UserProvider>
      </ThemeProvider>
    </AppRoot>
  );
}

export default App;