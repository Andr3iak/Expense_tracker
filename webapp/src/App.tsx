import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
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

// Обрабатывает переход по инвайт-ссылке.
// Читает start_param из Telegram WebApp и вступает в группу.
function InviteHandler() {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const tg = (window as any).Telegram?.WebApp;
    const startParam: string | undefined = tg?.initDataUnsafe?.start_param;
    if (!startParam) return;

    // Поддерживаем два формата: "join_<groupId>" и просто "<groupId>"
    const groupId = startParam.startsWith('join_')
      ? startParam.slice(5)
      : startParam;

    groupsApi
      .join(groupId, {
        telegramId: user.telegramId,
        username: tg?.initDataUnsafe?.user?.username,
        firstName: tg?.initDataUnsafe?.user?.first_name,
      })
      .then(() => navigate(`/group/${groupId}`))
      .catch(() => navigate(`/group/${groupId}`)); // уже в группе — всё равно переходим
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