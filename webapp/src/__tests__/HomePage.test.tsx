import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';

// Мокаем хук useTelegramAuth
vi.mock('../hooks/useTelegramAuth', () => ({
  useTelegramAuth: () => ({
    user: { firstName: 'Анна', id: 123 },
    initDataRaw: 'mock',
    isTelegramEnv: false,
  }),
}));

describe('HomePage', () => {
  it('отображает заголовок "Трекер расходов"', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    expect(screen.getByText(/Трекер расходов/i)).toBeInTheDocument();
  });

  it('отображает данные пользователя (firstName) в JSON', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    // Ищем подстроку "firstName": "Анна" внутри элемента pre
    expect(screen.getByText(/"firstName": "Анна"/)).toBeInTheDocument();
  });

  it('отображает блок initDataRaw', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    expect(screen.getByText(/initDataRaw/i)).toBeInTheDocument();
  });
});