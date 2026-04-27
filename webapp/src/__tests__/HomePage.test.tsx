import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage';

vi.mock('../hooks/useTelegramAuth', () => ({
  useTelegramAuth: () => ({
    user: {
      id: 999,
      firstName: 'Тестовый',
      lastName: 'Пользователь',
      username: 'test_user',
    },
    initDataRaw: 'mock_init_data',
    isTelegramEnv: false,
  }),
}));

vi.mock('../utils/api', () => ({
  groupsApi: {
    getAll: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('отображает аватар и приветствие пользователя', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    // Ожидаем окончания загрузки
    await waitFor(() => expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument());

    // Аватар – первая буква имени "Тестовый" → "Т"
    expect(screen.getByText('Т')).toBeInTheDocument();
    // Приветствие
    expect(screen.getByText(/Привет, Тестовый/)).toBeInTheDocument();
  });

  it('загружает и отображает список групп из API', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValue([
      { id: '1', name: 'Поездка на море', icon: '🏖️', membersCount: 4, balance: 1234, lastActivity: 'сегодня' },
      { id: '2', name: 'Квартира', icon: '🏠', membersCount: 2, balance: -567, lastActivity: 'вчера' },
    ]);

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument());

    // Проверяем названия групп
    expect(screen.getByText('Поездка на море')).toBeInTheDocument();
    expect(screen.getByText('Квартира')).toBeInTheDocument();

    // Проверяем количество участников через регулярное выражение (игнорируем пробелы и точку)
    expect(screen.getByText(/4\s*участника/)).toBeInTheDocument();
    expect(screen.getByText(/2\s*участника/)).toBeInTheDocument();

    // Баланс
    expect(screen.getByText('+1234 ₽')).toBeInTheDocument();
    expect(screen.getByText('-567 ₽')).toBeInTheDocument();
  });

  it('показывает сообщение, если нет групп', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    await waitFor(() => expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument());

    // Сообщение об отсутствии групп
    expect(screen.getByText('Нет групп. Создайте первую!')).toBeInTheDocument();
  });

  it('переход на страницу создания группы по клику на кнопку "+ Создать группу"', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Ждём, когда кнопка появится (после загрузки)
    const createButton = await screen.findByText('+ Создать группу');
    expect(createButton).toBeInTheDocument();

    await userEvent.click(createButton);
    expect(mockNavigate).toHaveBeenCalledWith('/create-group');
  });
});