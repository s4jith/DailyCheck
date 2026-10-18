'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import type { Profile } from '@/lib/types';

/** Loads the signed-in user's profile (name, email, avatar). */
export function useProfile() {
  const { status } = useSession();
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (status !== 'authenticated') return;
    try {
      const data = await api<Profile>('/api/profile');
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; state is set only after the request resolves
    void refresh();
  }, [refresh]);

  return { profile, loading, error, refresh };
}
