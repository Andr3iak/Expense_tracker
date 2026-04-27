import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

vi.mock('../context/UserContext', () => ({
  useUser: () => ({ user: { id: 1, firstName: 'Анна', username: 'anna23' } }),
}));

vi.mock('../utils/api', () => ({
  groupsApi: { getAll: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('HomePage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('показывает загрузку, затем список групп', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValue([
      { id: '1', name: 'Поездка в горы', icon: '🏔️', membersCount: 3, balance: 0, lastActivity: '' },
      { id: '2', name: 'Офисные обеды', icon: '🍱', membersCount: 5, balance: 0, lastActivity: '' },
    ]);
    render(<BrowserRouter><HomePage /></BrowserRouter>);
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Поездка в горы')).toBeInTheDocument());
    expect(screen.getByText('3 участника')).toBeInTheDocument();
    expect(screen.getByText('5 участников')).toBeInTheDocument();
  });

  it('показывает сообщение об отсутствии групп', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValue([]);
    render(<BrowserRouter><HomePage /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Нет групп. Создайте первую!')).toBeInTheDocument());
  });

  it('переход к созданию группы по кнопке +', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValue([]);
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    await waitFor(() => screen.getByText('+'));
    await userEvent.click(screen.getByText('+'));
    expect(mockNavigate).toHaveBeenCalledWith('/create-group');
  });

  it('отображает аватар и имя пользователя', async () => {
    const { groupsApi } = await import('../utils/api');
    vi.mocked(groupsApi.getAll).mockResolvedValue([]);
    render(<BrowserRouter><HomePage /></BrowserRouter>);
    await waitFor(() => expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument());
    expect(screen.getByText('АН')).toBeInTheDocument();
    expect(screen.getByText('Анна')).toBeInTheDocument();
    expect(screen.getByText('@anna23')).toBeInTheDocument();
  });
});