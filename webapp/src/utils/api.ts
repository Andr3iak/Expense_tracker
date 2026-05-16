const API_BASE = '/api';

export interface ApiError { message: string; status: number; }

export interface Group {
  id: string; name: string; icon?: string; balance: number;
  membersCount: number; lastActivity: string; archived?: boolean; archivedAt?: string;
}

export interface Category {
  id: string; label: string; emoji: string;
}

export interface Expense {
  id: string; amount: number; description: string; category: string;
  paidBy: number; paidByName?: string;
  participants: Array<{ userId: number; username: string | null }>;
  groupId: string; date: string;
}

export interface BalanceInfo {
  total: number;
  debts: Array<{ userId: number; amount: number; userName: string }>;
  balances: Array<{ userId: number; balance: number; userName: string }>;
  transactions: Array<{ from: number; to: number; amount: number; fromName: string; toName: string }>;
}

export interface DbUser { id: number; telegramId: number; username?: string | null; firstName?: string | null; }

export interface AppUser { id: number; telegramId: number; username: string | null; firstName: string | null; }

export interface GroupMember {
  id: number; telegramId: number; username: string | null;
  userId: number;
  user: { firstName: string | null; username: string | null; };
}

export interface GroupDetail {
  id: string; name: string; icon: string | null; membersCount: number;
  lastActivity: string; archived: boolean; archivedAt: string | null;
  members: GroupMember[];
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  groupIcon: string;
  invitedByName: string;
  createdAt: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' }, ...options,
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
  getAll: (): Promise<AppUser[]> => request<AppUser[]>('/users'),
  // Только пользователи из общих групп — безопаснее и удобнее для поиска
  getKnown: (userId: number): Promise<AppUser[]> =>
    request<AppUser[]>(`/users/known?userId=${userId}`),
};

export const groupsApi = {
  getAll: (userId: number): Promise<Group[]> => request<Group[]>(`/groups?userId=${userId}`),
  getArchived: (userId: number): Promise<Group[]> => request<Group[]>(`/groups/archived?userId=${userId}`),
  create: (data: { name: string; icon?: string; userId: number }): Promise<Group> =>
    request<Group>('/groups', { method: 'POST', body: JSON.stringify(data) }),
  getById: (id: string): Promise<GroupDetail> => request<GroupDetail>(`/groups/${id}`),
  update: (id: string, data: { name?: string; icon?: string; userId: number }): Promise<Group> =>
    request<Group>(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string, userId: number): Promise<{ id: string; deleted: boolean }> =>
    request(`/groups/${id}`, { method: 'DELETE', body: JSON.stringify({ userId }) }),
  archive: (id: string, userId: number): Promise<{ id: string; archived: boolean }> =>
    request(`/groups/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ userId }) }),
  unarchive: (id: string, userId: number): Promise<{ id: string; archived: boolean }> =>
    request(`/groups/${id}/unarchive`, { method: 'PATCH', body: JSON.stringify({ userId }) }),
  join: (groupId: string, data: { telegramId: number | string; username?: string; firstName?: string }) =>
    request(`/groups/${groupId}/join`, { method: 'POST', body: JSON.stringify(data) }),
  getInvitePreview: (groupId: string): Promise<GroupDetail> =>
    request<GroupDetail>(`/groups/${groupId}/invite-preview`),
  addMember: (groupId: string, userId: number): Promise<void> =>
    request(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
  removeMember: (groupId: string, userId: number): Promise<void> =>
    request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
  // Приглашения — вместо прямого добавления
  sendInvitation: (groupId: string, userId: number, invitedById: number): Promise<void> =>
    request(`/groups/${groupId}/invitations`, { method: 'POST', body: JSON.stringify({ userId, invitedById }) }),
  getMyInvitations: (userId: number): Promise<GroupInvitation[]> =>
    request<GroupInvitation[]>(`/groups/invitations?userId=${userId}`),
  acceptInvitation: (invitationId: string, userId: number): Promise<{ accepted: boolean; groupId: string }> =>
    request(`/groups/invitations/${invitationId}/accept`, { method: 'PATCH', body: JSON.stringify({ userId }) }),
  rejectInvitation: (invitationId: string, userId: number): Promise<{ rejected: boolean }> =>
    request(`/groups/invitations/${invitationId}/reject`, { method: 'PATCH', body: JSON.stringify({ userId }) }),
};

export const expensesApi = {
  getCategories: (): Promise<Category[]> => request<Category[]>('/categories'),
  getByGroup: (groupId: string): Promise<Expense[]> =>
    request<Expense[]>(`/groups/${groupId}/expenses`),
  create: (groupId: string, data: {
    amount: number; description: string; category?: string;
    paidBy: number; participantIds: number[];
  }): Promise<Expense> =>
    request<Expense>(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
  update: (groupId: string, expenseId: string, data: {
    amount?: number; description?: string; category?: string;
    paidBy?: number; participantIds?: number[];
  }): Promise<Expense> =>
    request<Expense>(`/groups/${groupId}/expenses/${expenseId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (groupId: string, expenseId: string): Promise<{ deleted: boolean }> =>
    request(`/groups/${groupId}/expenses/${expenseId}`, { method: 'DELETE' }),
};

export const balancesApi = {
  getByGroup: (groupId: string): Promise<BalanceInfo> =>
    request<BalanceInfo>(`/groups/${groupId}/balances`),
  // Записывает факт погашения долга — балансы автоматически обновятся при следующей загрузке
  createSettlement: (groupId: string, fromUserId: number, toUserId: number, amount: number): Promise<void> =>
    request(`/groups/${groupId}/balances/settlements`, {
      method: 'POST',
      body: JSON.stringify({ fromUserId, toUserId, amount }),
    }),
};
