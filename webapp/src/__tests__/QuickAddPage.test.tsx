import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QuickAddPage } from '../pages/QuickAddPage';
import { useUser } from '../context/UserContext';
import { groupsApi, expensesApi } from '../utils/api';

vi.mock('../context/UserContext', () => ({ useUser: vi.fn() }));
vi.mock('../utils/api', () => ({
  groupsApi: { getById: vi.fn() },
  expensesApi: { create: vi.fn() },
}));
vi.mock('../hooks', () => ({
  hapticNotification: vi.fn(),
  hapticImpact: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('QuickAddPage', () => {
  const mockUser = { id: 1 };
  const mockGroup = {
    id: 'group1',
    members: [
      { id: 1, userId: 1, user: { firstName: 'Анна' } },
      { id: 2, userId: 2, user: { firstName: 'Борис' } },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as any).mockReturnValue({ user: mockUser });
    (groupsApi.getById as any).mockResolvedValue(mockGroup);
  });

  it('добавляет расход и показывает успех', async () => {
    (expensesApi.create as any).mockResolvedValue({ id: 'new' });

    render(
      <MemoryRouter initialEntries={['/group/group1/quick-add']}>
        <Routes>
          <Route path="/group/:groupId/quick-add" element={<QuickAddPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByPlaceholderText('0'));
    await userEvent.type(screen.getByPlaceholderText('0'), '750');
    await userEvent.click(screen.getByText('Добавить'));

    await waitFor(() => {
      expect(expensesApi.create).toHaveBeenCalledWith('group1', {
        amount: 750,
        description: 'Быстрый расход',
        paidBy: 1,
        participantIds: [1, 2],
      });
      expect(screen.getByText('✓ Добавлено!')).toBeInTheDocument();
    });
  });
});
