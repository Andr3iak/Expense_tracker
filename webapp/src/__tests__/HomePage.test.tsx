import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';

// Мокаем хук useTelegramAuth, чтобы он возвращал тестового пользователя
vi.mock('../hooks/useTelegramAuth', () => ({
  useTelegramAuth: () => ({
    user: { firstName: 'Анна', id: 123 },
    initDataRaw: 'mock',
    isTelegramEnv: false,
  }),
}));

describe('HomePage', () => {
  it('отображает приветствие с именем пользователя', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    expect(screen.getByText(/Привет, Анна!/i)).toBeInTheDocument();
  });

  it('отображает кнопку "Создать группу"', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /создать группу/i })).toBeInTheDocument();
  });
});