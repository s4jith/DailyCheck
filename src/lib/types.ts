export type Category = string;

export const defaultCategories: Category[] = [
  'Food',
  'Transport',
  'Shopping',
  'Utilities',
  'Entertainment',
  'Health',
  'Other',
];

export const categoryIcons: Record<string, string> = {
  Food: 'Utensils',
  Transport: 'Car',
  Shopping: 'ShoppingBag',
  Utilities: 'Lightbulb',
  Entertainment: 'Ticket',
  Health: 'HeartPulse',
  Other: 'Sprout',
  Default: 'Shapes',
};

/** An expense as used by the UI; the API serializes `date` as an ISO string. */
export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: Category;
  date: Date;
  /** Account the expense was paid from; null for expenses logged before accounts existed. */
  accountId?: string | null;
};

/** Payload for creating an expense. */
export type NewExpense = Omit<Expense, 'id'>;

export type ExpenseVersion = {
  id: string;
  expenseId: string;
  description: string;
  amount: number;
  category: Category;
  date: Date;
  updatedAt: Date;
};

export type Budget = {
  id: string;
  category: Category;
  amount: number;
};

export type BudgetWithSpent = Budget & { spent: number };

/** A savings goal as returned by the API (dates serialized as ISO strings). */
export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
  createdAt: string;
};

/** Payload for creating or editing a goal. */
export type SavingsGoalInput = {
  name: string;
  targetAmount: number;
  targetDate?: Date;
};

export type UserCategory = {
  id: string;
  name: string;
};

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

/** A bank account as returned by the API. */
export type BankAccount = {
  id: string;
  name: string;
  balance: number;
  createdAt: string;
};

export type AccountTxnType =
  | 'opening'
  | 'credit'
  | 'debit'
  | 'transfer_in'
  | 'transfer_out'
  | 'expense';

/** One entry in an account's history (dates serialized as ISO strings). */
export type AccountTransaction = {
  id: string;
  accountId: string;
  type: AccountTxnType;
  amount: number;
  note: string | null;
  date: string;
  expenseId: string | null;
  transferId: string | null;
};
