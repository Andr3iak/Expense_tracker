import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BalancePage } from '../pages/BalancePage';
import { useUser } from '../context/UserContext';
import { balancesApi, groupsApi } from '../utils/api';

vi.mock('../context/UserContext', () => ({ useUser: vi.fn() }));
vi.mock('../utils/api', () => ({
  balancesApi: {
    getByGroup: vi.fn(),
    createSettlement: vi.fn(),
  },
  groupsApi: { getById: vi.fn() },
}));

describe('BalancePage', () => {
  const mockUser = { id: 1 };
  const mockGroup = { id: 'group1', name: 'Команда' };
  const mockBalanceInfo = {
    total: 1250,
    debts: [],
    transactions: [
      { from: 2, to: 1, amount: 400, fromName: 'Борис', toName: 'Анна' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useUser as any).mockReturnValue({ user: mockUser });
    (balancesApi.getByGroup as any).mockResolvedValue(mockBalanceInfo);
    (groupsApi.getById as any).mockResolvedValue(mockGroup);
    (balancesApi.createSettlement as any).mockResolvedValue({});
  });

  it('отображает общую сумму', async () => {
    render(
      <MemoryRouter initialEntries={['/group/group1/balance']}>
        <Routes>
          <Route path="/group/:groupId/balance" element={<BalancePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Итого по группе')).toBeInTheDocument();
      expect(screen.getByText(/1\s*250\s*₽/)).toBeInTheDocument();
      expect(screen.getByText('Кто кому должен')).toBeInTheDocument();
      expect(screen.getByText(/400\s*₽/)).toBeInTheDocument();
    });
  });

  it('открывает bottom sheet по клику на строку транзакции', async () => {
    render(
      <MemoryRouter initialEntries={['/group/group1/balance']}>
        <Routes>
          <Route path="/group/:groupId/balance" element={<BalancePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Нажмите для действий'));
    await userEvent.click(screen.getByText('Нажмите для действий'));

    expect(screen.getByText('Отметить как оплачено')).toBeInTheDocument();
    expect(screen.getByText('Запросить через Telegram')).toBeInTheDocument();
  });
});
