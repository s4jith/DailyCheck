'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  History,
  LoaderCircle,
  ReceiptText,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { api } from '@/lib/api';
import type { AccountTransaction, AccountTxnType, BankAccount } from '@/lib/types';
import { cn, formatInr } from '@/lib/utils';

const TXN_META: Record<AccountTxnType, { label: string; icon: LucideIcon; incoming: boolean }> = {
  opening: { label: 'Opening balance', icon: Wallet, incoming: true },
  credit: { label: 'Added', icon: ArrowDownLeft, incoming: true },
  debit: { label: 'Subtracted', icon: ArrowUpRight, incoming: false },
  transfer_in: { label: 'Transfer in', icon: ArrowLeftRight, incoming: true },
  transfer_out: { label: 'Transfer out', icon: ArrowLeftRight, incoming: false },
  expense: { label: 'Expense', icon: ReceiptText, incoming: false },
};

export function AccountHistorySheet({ account }: { account: BankAccount }) {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<AccountTransaction[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await api<AccountTransaction[]>(`/api/accounts/${account.id}/transactions`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={`History for ${account.name}`}
        >
          <History className="h-4 w-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{account.name}</SheetTitle>
          <SheetDescription>Balance {formatInr(account.balance)}</SheetDescription>
        </SheetHeader>
        <div className="-mx-6 mt-4 flex-1 overflow-y-auto px-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="py-6 text-sm text-destructive">{error}</p>
          ) : items.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-white/6">
              {items.map((item) => {
                const meta = TXN_META[item.type] ?? TXN_META.credit;
                const Icon = meta.icon;
                return (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <span
                      className={cn(
                        'icon-tile h-8 w-8 shrink-0 [&>svg]:h-4 [&>svg]:w-4',
                        meta.incoming && 'border-success/25 bg-success/10 text-success'
                      )}
                    >
                      <Icon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.note || meta.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {meta.label} · {format(new Date(item.date), 'PP')}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'tabular shrink-0 text-sm font-semibold',
                        meta.incoming ? 'text-success' : 'text-foreground'
                      )}
                    >
                      {meta.incoming ? '+' : '−'}
                      {formatInr(item.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
