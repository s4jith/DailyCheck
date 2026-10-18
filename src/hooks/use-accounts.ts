'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import type { BankAccount } from '@/lib/types';

/** Loads the user's bank accounts; `total` is the sum of their balances. */
export function useAccounts() {
  const { status } = useSession();
  const [accounts, setAccounts] = React.useState<BankAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const data = await api<BankAccount[]>('/api/accounts');
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; state is set only after the request resolves
    void refresh();
  }, [refresh]);

  const total = accounts.reduce((sum, account) => sum + account.balance, 0);

  return { accounts, total, loading, error, refresh };
}
