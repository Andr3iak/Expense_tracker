const API_BASE = '/api';

export interface ApiError {
  message: string;
  status: number;
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

export const groupsApi = {
  getAll: () => request<any[]>('/groups'),
  create: (data: { name: string; icon?: string }) =>
    request('/groups', { method: 'POST', body: JSON.stringify(data) }),
};

export const expensesApi = {
  getByGroup: (groupId: string) => request<any[]>(`/groups/${groupId}/expenses`),
  create: (groupId: string, data: any) =>
    request(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
};

export const balancesApi = {
  getByGroup: (groupId: string) => request<any>(`/groups/${groupId}/balances`),
};