'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import type { BudgetWithSpent } from '@/lib/types';

/**
 * Loads the user's budgets; each budget includes `spent` for the current
 * month, computed server-side.
 */
export function useBudgets() {
  const { status } = useSession();
  const [budgets, setBudgets] = React.useState<BudgetWithSpent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const data = await api<BudgetWithSpent[]>('/api/budgets');
      setBudgets(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; state is set only after the request resolves
    void refresh();
  }, [refresh]);

  return { budgets, loading, error, refresh };
}
