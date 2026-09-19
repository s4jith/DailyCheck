'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import { defaultCategories, type UserCategory } from '@/lib/types';

/** Loads the user's custom categories and merges them with the defaults. */
export function useCategories() {
  const { status } = useSession();
  const [userCategories, setUserCategories] = React.useState<UserCategory[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const data = await api<UserCategory[]>('/api/categories');
      setUserCategories(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; state is set only after the request resolves
    void refresh();
  }, [refresh]);

  const allCategories = React.useMemo(
    () => [...defaultCategories, ...userCategories.map((category) => category.name)],
    [userCategories]
  );

  return { defaultCategories, userCategories, allCategories, loading, error, refresh };
}
