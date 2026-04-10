import type { Group, Expense } from '../utils/api';


const GROUPS_KEY = 'expense_tracker_groups';
const EXPENSES_KEY = 'expense_tracker_expenses';

// Загружаем начальные данные, если хранилище пустое
const initMockData = () => {
  if (!localStorage.getItem(GROUPS_KEY)) {
    const defaultGroups: Group[] = [
      {
        id: '1',
        name: 'Поездка в горы',
        icon: '🏔️',
        balance: 0,
        membersCount: 3,
        lastActivity: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Офисные обеды',
        icon: '🍱',
        balance: 0,
        membersCount: 5,
        lastActivity: new Date().toISOString(),
      },
    ];
    localStorage.setItem(GROUPS_KEY, JSON.stringify(defaultGroups));
  }

  if (!localStorage.getItem(EXPENSES_KEY)) {
    const defaultExpenses: Expense[] = [
      {
        id: 'e1',
        amount: 1500,
        description: 'Бензин',
        paidBy: 99999999, // тестовый пользователь
        participants: [99999999, 12345678],
        groupId: '1',
        date: new Date().toISOString(),
      },
      {
        id: 'e2',
        amount: 3200,
        description: 'Ужин в кафе',
        paidBy: 12345678,
        participants: [99999999, 12345678],
        groupId: '1',
        date: new Date().toISOString(),
      },
    ];
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(defaultExpenses));
  }
};

initMockData();

// Вспомогательные функции
const getGroups = (): Group[] => JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]');
const saveGroups = (groups: Group[]) => localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));

const getExpenses = (): Expense[] => JSON.parse(localStorage.getItem(EXPENSES_KEY) || '[]');
const saveExpenses = (expenses: Expense[]) => localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));

// API-подобные методы
export const mockGroupsApi = {
  getAll: (): Promise<Group[]> => {
    return Promise.resolve(getGroups());
  },
  create: (data: { name: string; icon?: string }): Promise<Group> => {
    const groups = getGroups();
    const newGroup: Group = {
      id: Date.now().toString(),
      name: data.name,
      icon: data.icon || '👥',
      balance: 0,
      membersCount: 1,
      lastActivity: new Date().toISOString(),
    };
    groups.push(newGroup);
    saveGroups(groups);
    return Promise.resolve(newGroup);
  },
};

export const mockExpensesApi = {
  getByGroup: (groupId: string): Promise<Expense[]> => {
    const expenses = getExpenses().filter(e => e.groupId === groupId);
    return Promise.resolve(expenses);
  },
  create: (groupId: string, data: Omit<Expense, 'id' | 'groupId' | 'date'>): Promise<Expense> => {
    const expenses = getExpenses();
    const newExpense: Expense = {
      id: Date.now().toString(),
      groupId,
      date: new Date().toISOString(),
      ...data,
    };
    expenses.push(newExpense);
    saveExpenses(expenses);
    return Promise.resolve(newExpense);
  },
};

// Расчёт баланса (кто кому должен)
export const mockBalancesApi = {
  getByGroup: (groupId: string): Promise<{ total: number; debts: any[] }> => {
    const expenses = getExpenses().filter(e => e.groupId === groupId);
    let total = 0;
    const userBalances: Record<number, number> = {};

    expenses.forEach(exp => {
      total += exp.amount;
      const perPerson = exp.amount / exp.participants.length;
      // Тот, кто заплатил, получает "плюс" (ему должны)
      userBalances[exp.paidBy] = (userBalances[exp.paidBy] || 0) + exp.amount;
      // Каждый участник должен заплатить свою долю (минус)
      exp.participants.forEach(p => {
        userBalances[p] = (userBalances[p] || 0) - perPerson;
      });
    });

    // Преобразуем в массив долгов (положительные остатки — кому должны)
    const debts = Object.entries(userBalances)
      .filter(([, balance]) => Math.abs(balance) > 0.01)
      .map(([userId, balance]) => ({
        userId: Number(userId),
        amount: balance,
        userName: `User ${userId}`,
      }));

    return Promise.resolve({ total, debts });
  },
};