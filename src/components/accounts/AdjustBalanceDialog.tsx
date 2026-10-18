'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { LoaderCircle, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { BankAccount } from '@/lib/types';
import { formatInr } from '@/lib/utils';

export type AdjustInput = { type: 'credit' | 'debit'; amount: number; note?: string };

interface AdjustBalanceDialogProps {
  account: BankAccount;
  mode: 'credit' | 'debit';
  /** Returns true when the change was saved. */
  onSubmit: (accountId: string, data: AdjustInput) => Promise<boolean>;
}

export function AdjustBalanceDialog({ account, mode, onSubmit }: AdjustBalanceDialogProps) {
  const [open, setOpen] = useState(false);
  const isDebit = mode === 'debit';

  const formSchema = z.object({
    amount: z.coerce
      .number<number>()
      .positive('Enter an amount greater than zero.')
      .refine((value) => !isDebit || value <= account.balance + 0.005, {
        message: `Only ${formatInr(account.balance)} is in this account.`,
      }),
    note: z.string().trim().max(120, 'Note must be at most 120 characters.'),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 0, note: '' },
  });
  const amount = Number(useWatch({ control: form.control, name: 'amount' })) || 0;
  const nextBalance = account.balance + (isDebit ? -amount : amount);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) form.reset();
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const saved = await onSubmit(account.id, {
      type: mode,
      amount: data.amount,
      note: data.note || undefined,
    });
    if (saved) handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isDebit ? (
          <Button variant="outline" className="px-3" disabled={account.balance <= 0}>
            <Minus className="mr-1.5 h-4 w-4" /> Subtract
          </Button>
        ) : (
          <Button className="px-3">
            <Plus className="mr-1.5 h-4 w-4" /> Add
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isDebit ? 'Subtract from' : 'Add money to'} {account.name}
          </DialogTitle>
          <DialogDescription>Current balance: {formatInr(account.balance)}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="1000.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder={isDebit ? 'e.g., ATM withdrawal' : 'e.g., Salary'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="tabular text-sm text-muted-foreground">
              {formatInr(account.balance)} → {formatInr(Math.max(0, nextBalance))}
            </p>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isDebit ? 'Subtract' : 'Add Money'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
