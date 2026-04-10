// API-слой для связи с бэкендом. Здесь заменены все 'any' на конкретные типы.
const API_BASE = '/api';
// Общий тип ошибки от сервера

export interface ApiError {
  message: string;
  status: number;
}

// Определение типов данных, которые используются в API 
// Раньше вместо них был 'any', из-за чего линтер ругался.
export interface Group {
  id: string;
  name: string;
  icon?: string;
  balance: number;
  membersCount: number;
  lastActivity: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  paidBy: number;
  participants: number[];
  groupId: string;
  date: string;
}

export interface BalanceInfo {
  total: number;
  debts: Array<{ userId: number; amount: number; userName: string }>;
}

// Обобщённая функция запроса: <T> позволяет возвращать данные нужного типа.
// Раньше было Promise<any> — теперь типизировано.
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Ошибка ${res.status}`);
  }
  return res.json();
}
// Каждый метод теперь явно указывает, какие типы возвращает и принимает.
export const groupsApi = {
  getAll: (): Promise<Group[]> => request<Group[]>('/groups'),
  create: (data: { name: string; icon?: string }): Promise<Group> =>
    request<Group>('/groups', { method: 'POST', body: JSON.stringify(data) }),
};

export const expensesApi = {
  getByGroup: (groupId: string): Promise<Expense[]> => request<Expense[]>(`/groups/${groupId}/expenses`),
  create: (groupId: string, data: Omit<Expense, 'id'>): Promise<Expense> =>
    request<Expense>(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
};

export const balancesApi = {
  getByGroup: (groupId: string): Promise<BalanceInfo> => request<BalanceInfo>(`/groups/${groupId}/balances`),
};