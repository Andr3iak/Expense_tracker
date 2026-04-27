import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { HomePage } from '../pages/HomePage'; // уточни путь, если нужно

// Мокаем useUser — возвращаем тестового пользователя
vi.mock('../context/UserContext', () => ({
  useUser: () => ({
    user: { id: 1, firstName: 'Анна', username: 'anna23' },
  }),
}));

// Мокаем API групп
vi.mock('../utils/api', () => ({
  groupsApi: {
    getAll: vi.fn(),
  },
}));

// Мокаем навигацию
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

    render(<BrowserRouter><HomePage /></BrowserRouter>);

    // Проверяем аватар (первые буквы "Анна" → "АН")
    expect(screen.getByText('АН')).toBeInTheDocument();
    expect(screen.getByText(/Привет, Анна/)).toBeInTheDocument();
    expect(screen.getByText('@anna23')).toBeInTheDocument();
  });

  it('загружает и отображает список групп из API', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValue([
      { id: '1', name: 'Поездка в горы', icon: '🏔️', membersCount: 3, balance: 1234, lastActivity: '' },
      { id: '2', name: 'Офисные обеды', icon: '🍱', membersCount: 5, balance: -567, lastActivity: '' },
    ]);

    render(<BrowserRouter><HomePage /></BrowserRouter>);

    // Ожидаем появления названий групп
    await waitFor(() => {
      expect(screen.getByText('Поездка в горы')).toBeInTheDocument();
      expect(screen.getByText('Офисные обеды')).toBeInTheDocument();
    });

    // Проверяем количество участников и баланс
    expect(screen.getByText('3 участника')).toBeInTheDocument();
    expect(screen.getByText('5 участников')).toBeInTheDocument();
    expect(screen.getByText('+1234 ₽')).toBeInTheDocument();
    expect(screen.getByText('-567 ₽')).toBeInTheDocument();
  });

  it('показывает кнопку "+ Создать группу" и она ведёт на /create-group', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValue([]);

    render(<BrowserRouter><HomePage /></BrowserRouter>);

    const createButton = screen.getByText('+ Создать группу');
    expect(createButton).toBeInTheDocument();

    await userEvent.click(createButton);
    expect(mockNavigate).toHaveBeenCalledWith('/create-group');
  });

  it('корректно обрабатывает случай, когда нет групп', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValue([]);

    render(<BrowserRouter><HomePage /></BrowserRouter>);

    // Проверяем, что список групп пуст (нет ни одного элемента группы)
    await waitFor(() => {
      expect(screen.queryByText('Поездка в горы')).not.toBeInTheDocument();
    });
    // Заголовок "Ваши группы" и кнопка создания должны быть
    expect(screen.getByText('Ваши группы')).toBeInTheDocument();
    expect(screen.getByText('+ Создать группу')).toBeInTheDocument();
  });
});