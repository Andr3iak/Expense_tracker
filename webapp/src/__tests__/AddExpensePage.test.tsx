import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AddExpensePage } from '../pages/AddExpensePage';
import { useUser } from '../context/UserContext';
import { groupsApi, expensesApi } from '../utils/api';

vi.mock('../context/UserContext', () => ({ useUser: vi.fn() }));
vi.mock('../utils/api', () => ({
  groupsApi: { getById: vi.fn() },
  expensesApi: { getCategories: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AddExpensePage', () => {
  const mockUser = { id: 1 };
  const mockGroup = {
    id: 'group1',
    members: [
      { id: 1, userId: 1, user: { firstName: 'Анна' } },
      { id: 2, userId: 2, user: { firstName: 'Борис' } },
    ],
  };
  const mockCategories = [
    { id: 'food', label: 'Еда', emoji: '🍔' },
    { id: 'transport', label: 'Транспорт', emoji: '🚕' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as any).mockReturnValue({ user: mockUser });
    (groupsApi.getById as any).mockResolvedValue(mockGroup);
    (expensesApi.getCategories as any).mockResolvedValue(mockCategories);
  });

  it('рендерит форму и валидирует поля', async () => {
    render(
      <MemoryRouter initialEntries={['/group/group1/add-expense']}>
        <Routes>
          <Route path="/group/:groupId/add-expense" element={<AddExpensePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('За что')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Далее →');
    expect(nextButton).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText('0'), '1230');
    await userEvent.type(screen.getByPlaceholderText('За что'), 'Такси');
    expect(nextButton).toBeEnabled();
  });

  it('переходит на страницу разделения при валидных данных', async () => {
    render(
      <MemoryRouter initialEntries={['/group/group1/add-expense']}>
        <Routes>
          <Route path="/group/:groupId/add-expense" element={<AddExpensePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByPlaceholderText('0'));
    await userEvent.type(screen.getByPlaceholderText('0'), '500');
    await userEvent.type(screen.getByPlaceholderText('За что'), 'Кофе');
    await userEvent.click(screen.getByText('Далее →'));

    expect(mockNavigate).toHaveBeenCalledWith('/group/group1/split', {
      state: { amount: 500, description: 'Кофе', category: 'other', paidBy: 1 },
    });
  });
});
