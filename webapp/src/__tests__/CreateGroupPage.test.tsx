import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CreateGroupPage } from '../pages/CreateGroupPage';
import { useUser } from '../context/UserContext';
import { groupsApi } from '../utils/api';
import { hapticNotification } from '../hooks';

vi.mock('../context/UserContext', () => ({ useUser: vi.fn() }));
vi.mock('../utils/api', () => ({ groupsApi: { create: vi.fn() } }));
vi.mock('../hooks', () => ({ hapticNotification: vi.fn() }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreateGroupPage', () => {
  const mockUser = { id: 1, telegramId: 123, username: 'tester' };
  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as any).mockReturnValue({ user: mockUser });
  });

  it('отображает форму создания группы', () => {
    render(<MemoryRouter><CreateGroupPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText('Название группы')).toBeInTheDocument();
    expect(screen.getByText('Создать группу')).toBeInTheDocument();
  });

  it('создаёт группу и переходит на страницу приглашения', async () => {
    const createdGroup = { id: 'new123', name: 'Пикник' };
    (groupsApi.create as any).mockResolvedValue(createdGroup);
    render(<MemoryRouter><CreateGroupPage /></MemoryRouter>);
    await userEvent.type(screen.getByPlaceholderText('Название группы'), 'Пикник');
    await userEvent.click(screen.getByText('Создать группу'));
    await waitFor(() => {
      expect(groupsApi.create).toHaveBeenCalledWith({ name: 'Пикник', icon: undefined, userId: mockUser.id });
      expect(hapticNotification).toHaveBeenCalledWith('success');
      expect(mockNavigate).toHaveBeenCalledWith('/group/new123/members');
    });
  });
});
