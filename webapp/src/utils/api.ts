const API_BASE = '/api';

export interface ApiError {
  message: string;
  status: number;
}

export interface Group {
  id: string;
  name: string;
  icon?: string;
  balance: number;
  membersCount: number;
  lastActivity: string;
  archived?: boolean;
  archivedAt?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  paidBy: number;
  paidByName?: string;
  participants: Array<{ userId: number; username: string | null }>;
  groupId: string;
  date: string;
}

export interface BalanceInfo {
  total: number;
  balances: Array<{ userId: number; balance: number; userName: string }>;
  transactions: Array<{
    from: number;
    to: number;
    amount: number;
    fromName: string;
    toName: string;
  }>;
}

export interface DbUser {
  id: number;
  telegramId: number;
  username?: string | null;
}

export interface GroupDetail {
  id: string;
  name: string;
  icon: string | null;
  membersCount: number;
  lastActivity: string;
  archived: boolean;
  archivedAt: string | null;
  members: Array<{ id: number; telegramId: number; username: string | null }>;
}

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

export const usersApi = {
  upsert: (data: { telegramId: number | string; username?: string; firstName?: string }): Promise<DbUser> =>
    request<DbUser>('/users/upsert', { method: 'POST', body: JSON.stringify(data) }),

  getByTelegramId: (telegramId: number | string): Promise<DbUser> =>
    request<DbUser>(`/users/by-telegram/${telegramId}`),
};

export const groupsApi = {
  getAll: (userId: number): Promise<Group[]> =>
    request<Group[]>(`/groups?userId=${userId}`),

  getArchived: (userId: number): Promise<Group[]> =>
    request<Group[]>(`/groups/archived?userId=${userId}`),

  create: (data: { name: string; icon?: string; userId: number }): Promise<Group> =>
    request<Group>('/groups', { method: 'POST', body: JSON.stringify(data) }),

  getById: (id: string): Promise<GroupDetail> =>
    request<GroupDetail>(`/groups/${id}`),

  // Редактировать название и/или иконку
  update: (id: string, data: { name?: string; icon?: string; userId: number }): Promise<Group> =>
    request<Group>(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Архивировать группу
  archive: (id: string, userId: number): Promise<{ id: string; archived: boolean }> =>
    request(`/groups/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ userId }) }),

  // Восстановить из архива
  unarchive: (id: string, userId: number): Promise<{ id: string; archived: boolean }> =>
    request(`/groups/${id}/unarchive`, { method: 'PATCH', body: JSON.stringify({ userId }) }),

  join: (groupId: string, data: { telegramId: number | string; username?: string }) =>
    request(`/groups/${groupId}/join`, { method: 'POST', body: JSON.stringify(data) }),

  getInvitePreview: (groupId: string): Promise<GroupDetail> =>
    request<GroupDetail>(`/groups/${groupId}/invite-preview`),
};

export const expensesApi = {
  getByGroup: (groupId: string): Promise<Expense[]> =>
    request<Expense[]>(`/groups/${groupId}/expenses`),

  create: (
    groupId: string,
    data: { amount: number; description: string; paidBy: number; participantIds: number[] },
  ): Promise<Expense> =>
    request<Expense>(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
};

export const balancesApi = {
  getByGroup: (groupId: string): Promise<BalanceInfo> =>
    request<BalanceInfo>(`/groups/${groupId}/balances`),
};