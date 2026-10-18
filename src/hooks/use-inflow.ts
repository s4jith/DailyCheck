'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';

/** Sum of money added to the user's accounts within `range`. */
export function useInflow(range: { from: Date; to: Date }) {
  const { status } = useSession();
  const [total, setTotal] = React.useState(0);
  const from = range.from.toISOString();
  const to = range.to.toISOString();

  React.useEffect(() => {
    if (status !== 'authenticated') return;
    const params = new URLSearchParams({ from, to });
    api<{ total: number }>(`/api/accounts/inflow?${params}`)
      .then((data) => setTotal(data.total))
      .catch(() => setTotal(0));
  }, [status, from, to]);

  return { total };
}
