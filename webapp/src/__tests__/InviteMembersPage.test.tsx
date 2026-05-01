import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InviteMembersPage } from '../pages/InviteMembersPage';
import { useUser } from '../context/UserContext';
import { groupsApi, usersApi } from '../utils/api';

vi.mock('../context/UserContext', () => ({ useUser: vi.fn() }));
vi.mock('../utils/api', () => ({
  groupsApi: {
    getById: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
  },
  usersApi: {
    getAll: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('InviteMembersPage', () => {
  const mockUser = { id: 1 };
  const mockGroup = {
    id: 'group1',
    name: 'Путешествие',
    members: [
      { id: 1, userId: 1, user: { firstName: 'Анна', username: 'anna' } },
    ],
  };
  const mockAllUsers = [
    { id: 1, firstName: 'Анна', username: 'anna' },
    { id: 2, firstName: 'Борис', username: 'boris' },
    { id: 3, firstName: 'Виктор', username: 'viktor' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as any).mockReturnValue({ user: mockUser });
    (groupsApi.getById as any).mockResolvedValue(mockGroup);
    (usersApi.getAll as any).mockResolvedValue(mockAllUsers);
  });

  it('отображает текущих участников и список для добавления', async () => {
    render(
      <MemoryRouter initialEntries={['/group/group1/members']}>
        <Routes>
          <Route path="/group/:groupId/members" element={<InviteMembersPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('В группе (1)')).toBeInTheDocument();
      expect(screen.getByText('Анна (вы)')).toBeInTheDocument();
      expect(screen.getByText('Добавить')).toBeInTheDocument();
      expect(screen.getByText('Борис')).toBeInTheDocument();
      expect(screen.getByText('Виктор')).toBeInTheDocument();
    });
  });

  it('добавляет нового участника по клику на +', async () => {
    render(
      <MemoryRouter initialEntries={['/group/group1/members']}>
        <Routes>
          <Route path="/group/:groupId/members" element={<InviteMembersPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Борис'));
    const addButton = screen.getAllByText('+')[0];
    await userEvent.click(addButton);

    await waitFor(() => {
      expect(groupsApi.addMember).toHaveBeenCalledWith('group1', 2);
    });
  });

  it('удаляет участника (кроме себя) по клику на кнопку с минусом', async () => {
    // Добавим второго участника для удаления
    const groupWithTwo = {
      ...mockGroup,
      members: [
        ...mockGroup.members,
        { id: 2, userId: 2, user: { firstName: 'Борис', username: 'boris' } },
      ],
    };
    (groupsApi.getById as any).mockResolvedValue(groupWithTwo);

    render(
      <MemoryRouter initialEntries={['/group/group1/members']}>
        <Routes>
          <Route path="/group/:groupId/members" element={<InviteMembersPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Борис'));
    const removeButtons = screen.getAllByText('−');
    // Кнопка удаления рядом с Борисом (не с Анной)
    await userEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(groupsApi.removeMember).toHaveBeenCalledWith('group1', 2);
    });
  });
});
