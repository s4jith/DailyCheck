'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeftRight, LoaderCircle } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BankAccount } from '@/lib/types';
import { formatInr } from '@/lib/utils';

export type TransferInput = { fromId: string; toId: string; amount: number; note?: string };

interface TransferDialogProps {
  accounts: BankAccount[];
  /** Returns true when the transfer was saved. */
  onSubmit: (data: TransferInput) => Promise<boolean>;
}

export function TransferDialog({ accounts, onSubmit }: TransferDialogProps) {
  const [open, setOpen] = useState(false);

  const formSchema = z
    .object({
      fromId: z.string().min(1, 'Choose an account.'),
      toId: z.string().min(1, 'Choose an account.'),
      amount: z.coerce.number<number>().positive('Enter an amount greater than zero.'),
      note: z.string().trim().max(120, 'Note must be at most 120 characters.'),
    })
    .refine((value) => value.fromId !== value.toId, {
      message: 'Pick two different accounts.',
      path: ['toId'],
    })
    .refine(
      (value) => {
        const from = accounts.find((account) => account.id === value.fromId);
        return !from || value.amount <= from.balance + 0.005;
      },
      { message: 'That is more than the account holds.', path: ['amount'] }
    );

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { fromId: '', toId: '', amount: 0, note: '' },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) form.reset();
  };

  const handleSubmit = async (data: FormValues) => {
    const saved = await onSubmit({ ...data, note: data.note || undefined });
    if (saved) handleOpenChange(false);
  };

  const accountSelect = (name: 'fromId' | 'toId', label: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} · {formatInr(account.balance)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={accounts.length < 2}>
          <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Between Accounts</DialogTitle>
          <DialogDescription>Your total amount stays the same.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {accountSelect('fromId', 'From')}
            {accountSelect('toId', 'To')}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="5000.00" {...field} />
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
                    <Input placeholder="e.g., Moving savings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              Transfer
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
