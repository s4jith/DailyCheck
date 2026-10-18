'use client';

import { useState } from 'react';
import { Landmark, LoaderCircle, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { AccountDialog } from '@/components/accounts/AccountDialog';
import { AccountHistorySheet } from '@/components/accounts/AccountHistorySheet';
import { AdjustBalanceDialog, type AdjustInput } from '@/components/accounts/AdjustBalanceDialog';
import type { BankAccount } from '@/lib/types';
import { formatInr } from '@/lib/utils';

interface AccountCardProps {
  account: BankAccount;
  /** Share of the total amount this account holds, 0–100. */
  share: number;
  onRename: (accountId: string, name: string) => Promise<boolean>;
  onAdjust: (accountId: string, data: AdjustInput) => Promise<boolean>;
  onDelete: (accountId: string) => Promise<void>;
}

export function AccountCard({ account, share, onRename, onAdjust, onDelete }: AccountCardProps) {
  const [deleting, setDeleting] = useState(false);
  const hasBalance = Math.abs(account.balance) >= 0.005;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(account.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader className="flex-1 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="icon-tile h-8 w-8 shrink-0 [&>svg]:h-4 [&>svg]:w-4">
              <Landmark />
            </span>
            <p className="truncate font-headline font-semibold tracking-tight" title={account.name}>
              {account.name}
            </p>
          </div>
          <div className="-mr-2 flex shrink-0 items-center">
            <AccountHistorySheet account={account} />
            <AccountDialog
              account={account}
              onSubmit={({ name }) => onRename(account.id, name)}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive"
                  disabled={deleting}
                  aria-label={`Delete account ${account.name}`}
                >
                  {deleting ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {hasBalance ? 'Account still has money' : 'Delete this account?'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {hasBalance
                      ? `${account.name} holds ${formatInr(account.balance)}. Transfer or subtract it first, then delete the account.`
                      : `"${account.name}" will be removed. If expenses were paid from it, it is hidden instead so their history stays intact.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{hasBalance ? 'OK' : 'Cancel'}</AlertDialogCancel>
                  {!hasBalance && (
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <p className="tabular pt-3 font-headline text-2xl font-bold tracking-tight">
          {formatInr(account.balance)}
        </p>
        <p className="text-xs text-muted-foreground">{Math.round(share)}% of your total</p>
      </CardHeader>

      <CardFooter className="grid grid-cols-2 gap-2">
        <AdjustBalanceDialog account={account} mode="credit" onSubmit={onAdjust} />
        <AdjustBalanceDialog account={account} mode="debit" onSubmit={onAdjust} />
      </CardFooter>
    </Card>
  );
}
