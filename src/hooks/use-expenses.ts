'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import type { Expense } from '@/lib/types';

type ExpenseDto = Omit<Expense, 'date'> & { date: string };

/**
 * Loads the signed-in user's expenses, optionally restricted to a date
 * range. Call `refresh` after mutations to re-sync.
 */
export function useExpenses(range?: { from?: Date; to?: Date }) {
  const { status } = useSession();
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fromIso = range?.from?.toISOString();
  const toIso = range?.to?.toISOString();

  const refresh = React.useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const params = new URLSearchParams();
      if (fromIso) params.set('from', fromIso);
      if (toIso) params.set('to', toIso);
      const query = params.toString();
      const data = await api<ExpenseDto[]>(`/api/expenses${query ? `?${query}` : ''}`);
      setExpenses(data.map((expense) => ({ ...expense, date: new Date(expense.date) })));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [status, fromIso, toIso]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; state is set only after the request resolves
    void refresh();
  }, [refresh]);

  return { expenses, loading, error, refresh };
}
