import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BalancePage } from '../pages/BalancePage';
import { useUser } from '../context/UserContext';
import { balancesApi, groupsApi } from '../utils/api';

vi.mock('../context/UserContext', () => ({ useUser: vi.fn() }));
vi.mock('../utils/api', () => ({
  balancesApi: { getByGroup: vi.fn() },
  groupsApi: { getById: vi.fn() },
}));

describe('BalancePage', () => {
  const mockUser = { id: 1 };
  const mockGroup = { id: 'group1', name: 'Команда' };
  const mockBalanceInfo = {
    total: 1250,
    debts: [
      { userId: 2, amount: -400, userName: 'Борис' },
      { userId: 3, amount: 150, userName: 'Виктор' },
    ],
  };

  beforeEach(() => {
    (useUser as any).mockReturnValue({ user: mockUser });
    (balancesApi.getByGroup as any).mockResolvedValue(mockBalanceInfo);
    (groupsApi.getById as any).mockResolvedValue(mockGroup);
  });

  it('отображает общую сумму и балансы участников', async () => {
    render(
      <MemoryRouter initialEntries={['/group/group1/balance']}>
        <Routes>
          <Route path="/group/:groupId/balance" element={<BalancePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Итого по группе')).toBeInTheDocument();
      expect(screen.getByText(/1[\s]?250[\s]?₽/)).toBeInTheDocument();
      expect(screen.getByText('Борис')).toBeInTheDocument();
      expect(screen.getByText(/400[\s]?₽/)).toBeInTheDocument();
      expect(screen.getByText('Виктор')).toBeInTheDocument();
      expect(screen.getByText(/150[\s]?₽/)).toBeInTheDocument();
    });
  });

  it('открывает bottom sheet и показывает действия', async () => {
    render(
      <MemoryRouter initialEntries={['/group/group1/balance']}>
        <Routes>
          <Route path="/group/:groupId/balance" element={<BalancePage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('Борис'));
    await userEvent.click(screen.getByText('Борис'));

    expect(screen.getByText('Отметить как оплачено')).toBeInTheDocument();
    expect(screen.getByText('Запросить через Telegram')).toBeInTheDocument();
  });
});
