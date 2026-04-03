export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
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
  receiptPhoto?: string;
}