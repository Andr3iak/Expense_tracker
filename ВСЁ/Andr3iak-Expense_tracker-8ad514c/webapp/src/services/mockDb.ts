import type { Group, Expense } from '../utils/api';

const GROUPS_KEY = 'expense_tracker_groups';
const EXPENSES_KEY = 'expense_tracker_expenses';

const initMockData = () => {
  if (!localStorage.getItem(GROUPS_KEY)) {
    const defaultGroups: Group[] = [
      { id: '1', name: 'Поездка в горы', icon: '🏔️', balance: 0, membersCount: 3, lastActivity: new Date().toISOString() },
      { id: '2', name: 'Офисные обеды', icon: '🍱', balance: 0, membersCount: 5, lastActivity: new Date().toISOString() },
    ];
    localStorage.setItem(GROUPS_KEY, JSON.stringify(defaultGroups));
  }

  if (!localStorage.getItem(EXPENSES_KEY)) {
    const defaultExpenses: Expense[] = [
      {
        id: 'e1', amount: 1500, description: 'Бензин', category: 'transport', paidBy: 99999999,
        participants: [{ userId: 99999999, username: 'test_user' }, { userId: 12345678, username: null }],
        groupId: '1', date: new Date().toISOString(),
      },
      {
        id: 'e2', amount: 3200, description: 'Ужин в кафе', category: 'food', paidBy: 12345678,
        participants: [{ userId: 99999999, username: 'test_user' }, { userId: 12345678, username: null }],
        groupId: '1', date: new Date().toISOString(),
      },
    ];
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(defaultExpenses));
  }
};

initMockData();

const getGroups = (): Group[] => JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
const saveGroups = (groups: Group[]) => localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
const getExpenses = (): Expense[] => JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]');
const saveExpenses = (expenses: Expense[]) => localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));

export const mockGroupsApi = {
  getAll: (): Promise<Group[]> => Promise.resolve(getGroups()),
  create: (data: { name: string; icon?: string }): Promise<Group> => {
    const groups = getGroups();
    const newGroup: Group = {
      id: Date.now().toString(), name: data.name, icon: data.icon || '👥',
      balance: 0, membersCount: 1, lastActivity: new Date().toISOString(),
    };
    groups.push(newGroup);
    saveGroups(groups);
    return Promise.resolve(newGroup);
  },
};

export const mockExpensesApi = {
  getByGroup: (groupId: string): Promise<Expense[]> =>
    Promise.resolve(getExpenses().filter((e) => e.groupId === groupId)),

  create: (groupId: string, data: Omit<Expense, 'id' | 'groupId' | 'date'>): Promise<Expense> => {
    const expenses = getExpenses();
    const newExpense: Expense = {
      id: Date.now().toString(), groupId,
      date: new Date().toISOString(), ...data,
    };
    expenses.push(newExpense);
    saveExpenses(expenses);
    return Promise.resolve(newExpense);
  },
};

export const mockBalancesApi = {
  getByGroup: (groupId: string) => {
    const expenses = getExpenses().filter((e) => e.groupId === groupId);
    let total = 0;
    const userBalances: Record<number, number> = {};

    expenses.forEach((exp) => {
      total += exp.amount;
      const perPerson = exp.amount / exp.participants.length;
      userBalances[exp.paidBy] = (userBalances[exp.paidBy] || 0) + exp.amount;
      exp.participants.forEach((p) => {
        userBalances[p.userId] = (userBalances[p.userId] || 0) - perPerson;
      });
    });

    const debts = Object.entries(userBalances)
      .filter(([, balance]) => Math.abs(balance) > 0.01)
      .map(([userId, balance]) => ({ userId: Number(userId), amount: balance, userName: `User ${userId}` }));

    return Promise.resolve({
      total, debts,
      balances: debts.map((d) => ({ userId: d.userId, balance: d.amount, userName: d.userName })),
      transactions: [],
    });
  },
};