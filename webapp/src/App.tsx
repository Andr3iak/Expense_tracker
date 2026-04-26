// Корневой компонент. Настраивает маршрутизацию для всех 10 экранов дизайна.
// AppRoot и ThemeProvider из @telegram-apps/telegram-ui убраны —
// дизайн теперь реализован через кастомные компоненты с инлайн-стилями.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import {
  HomePage,
  GroupPage,
  AddExpensePage,
  CreateGroupPage,
  InviteMembersPage,
  SplitModePage,
  BalancePage,
  CloseGroupPage,
  DisputePage,
  QuickAddPage,
} from './pages';

// SAFE_TOP — отступ сверху для Dynamic Island / строки состояния на iOS.
// В production можно заменить на Telegram.WebApp.safeAreaInset.top.
const SAFE_TOP = 62;

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        {/* Обёртка задаёт фон, шрифт и безопасную зону сверху для всего приложения */}
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
