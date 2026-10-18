'use client';

import { Landmark } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { AccountCard } from '@/components/accounts/AccountCard';
import { AccountDialog } from '@/components/accounts/AccountDialog';
import { TransferDialog, type TransferInput } from '@/components/accounts/TransferDialog';
import type { AdjustInput } from '@/components/accounts/AdjustBalanceDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAccounts } from '@/hooks/use-accounts';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { formatInr } from '@/lib/utils';

export default function AccountsPage() {
  const { accounts, total, loading, error, refresh } = useAccounts();
  const { toast } = useToast();

  /** Runs a request, toasts the outcome and reloads the accounts. */
  const run = async (request: () => Promise<unknown>, success: string, fallback: string) => {
    try {
      await request();
      toast({ title: 'Success', description: success });
      await refresh();
      return true;
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : fallback,
      });
      return false;
    }
  };

  const createAccount = (data: { name: string; openingBalance: number }) =>
    run(
      () => api('/api/accounts', { method: 'POST', body: JSON.stringify(data) }),
      `Account "${data.name}" added.`,
      'Failed to add account.'
    );

  const renameAccount = (accountId: string, name: string) =>
    run(
      () => api(`/api/accounts/${accountId}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
      'Account renamed.',
      'Failed to rename account.'
    );

  const adjustAccount = (accountId: string, data: AdjustInput) =>
    run(
      () =>
        api(`/api/accounts/${accountId}/adjust`, { method: 'POST', body: JSON.stringify(data) }),
      data.type === 'credit'
        ? `${formatInr(data.amount)} added.`
        : `${formatInr(data.amount)} subtracted.`,
      'Failed to update balance.'
    );

  const transfer = (data: TransferInput) =>
    run(
      () => api('/api/accounts/transfer', { method: 'POST', body: JSON.stringify(data) }),
      `${formatInr(data.amount)} transferred.`,
      'Failed to transfer.'
    );

  const deleteAccount = async (accountId: string) => {
    await run(
      () => api(`/api/accounts/${accountId}`, { method: 'DELETE' }),
      'Account removed.',
      'Failed to delete account.'
    );
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Accounts"
        description="Every bank account in one place. Your total amount is their sum."
      >
        <TransferDialog accounts={accounts} onSubmit={transfer} />
        <AccountDialog onSubmit={createAccount} />
      </PageHeader>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/8 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {accounts.length > 0 && (
            <Card className="mb-4 sm:mb-5">
              <CardContent className="flex flex-wrap items-baseline justify-between gap-2 pt-5 sm:pt-6">
                <span className="text-sm font-medium text-muted-foreground">
                  Total amount across {accounts.length} account{accounts.length === 1 ? '' : 's'}
                </span>
                <span className="tabular font-headline text-2xl font-bold tracking-tight">
                  {formatInr(total)}
                </span>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                share={total > 0 ? (account.balance / total) * 100 : 0}
                onRename={renameAccount}
                onAdjust={adjustAccount}
                onDelete={deleteAccount}
              />
            ))}
          </div>
          {accounts.length === 0 && (
            <EmptyState
              icon={Landmark}
              title="No accounts yet"
              description="Add each bank account with its current balance. Expenses you log come out of the account you pick."
              action={<AccountDialog onSubmit={createAccount} />}
            />
          )}
        </>
      )}
    </div>
  );
}
