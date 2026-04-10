import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { HomePage, GroupPage, AddExpensePage } from './pages';
import { ThemeProvider } from './components/ThemeProvider';

function App() {
  return (
    <AppRoot>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/group/:groupId" element={<GroupPage />} />
            <Route path="/group/:groupId/add-expense" element={<AddExpensePage />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AppRoot>
  );
}

export default App;