'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import type { SavingsGoal } from '@/lib/types';

/** Loads the user's savings goals. */
export function useSavingsGoals() {
  const { status } = useSession();
  const [goals, setGoals] = React.useState<SavingsGoal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const data = await api<SavingsGoal[]>('/api/goals');
      setGoals(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load savings goals.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; state is set only after the request resolves
    void refresh();
  }, [refresh]);

  return { goals, loading, error, refresh };
}
