'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, LoaderCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import type { Expense, NewExpense } from '@/lib/types';
import { useCategories } from '@/hooks/use-categories';
import { useAccounts } from '@/hooks/use-accounts';
import { formatInr } from '@/lib/utils';

const LAST_ACCOUNT_KEY = 'dailycheck:last-account';

function readLastAccount() {
  try {
    return localStorage.getItem(LAST_ACCOUNT_KEY) ?? '';
  } catch {
    return '';
  }
}

const baseExpenseFormSchema = z.object({
  description: z.string().trim().min(2, 'Description must be at least 2 characters.').max(200),
  amount: z.coerce.number<number>().positive('Amount must be a positive number.'),
  category: z.string().min(1, 'Please select a category.'),
  date: z.date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Invalid time format. Use HH:mm',
  }),
  /** Empty only when editing an expense logged before accounts existed. */
  accountId: z.string(),
});

type ExpenseFormValues = z.infer<typeof baseExpenseFormSchema>;

interface ExpenseFormProps {
  initialValues?: Expense;
  /** Returns true when the expense was persisted; the form resets on success. */
  onSubmit: (data: NewExpense) => Promise<boolean>;
}

export function ExpenseForm({ initialValues, onSubmit }: ExpenseFormProps) {
  const { allCategories } = useCategories();
  const { accounts } = useAccounts();
  // New expenses must name an account; older unlinked ones may stay unlinked.
  const requireAccount = !initialValues || Boolean(initialValues.accountId);

  const expenseFormSchema = React.useMemo(
    () =>
      baseExpenseFormSchema.refine((value) => !requireAccount || value.accountId !== '', {
        message: 'Choose the account this was paid from.',
        path: ['accountId'],
      }),
    [requireAccount]
  );

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    values: initialValues
      ? {
          description: initialValues.description,
          amount: initialValues.amount,
          category: initialValues.category,
          date: new Date(initialValues.date),
          time: format(new Date(initialValues.date), 'HH:mm'),
          accountId: initialValues.accountId ?? '',
        }
      : undefined,
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date(),
      time: format(new Date(), 'HH:mm'),
      accountId: '',
    },
  });

  // Pre-select the account used last time once the accounts have loaded.
  React.useEffect(() => {
    if (initialValues || accounts.length === 0 || form.getValues('accountId')) return;
    const last = readLastAccount();
    const fallback = accounts.length === 1 ? accounts[0].id : '';
    const pick = accounts.some((account) => account.id === last) ? last : fallback;
    if (pick) form.setValue('accountId', pick);
  }, [accounts, initialValues, form]);

  const handleSubmit = async (data: ExpenseFormValues) => {
    const [hours, minutes] = data.time.split(':').map(Number);
    const date = new Date(data.date);
    date.setHours(hours, minutes, 0, 0);

    // Send only persisted fields — `time` is already folded into `date`.
    const saved = await onSubmit({
      description: data.description,
      amount: data.amount,
      category: data.category,
      date,
      accountId: data.accountId || null,
    });
    if (saved) {
      if (data.accountId) {
        try {
          localStorage.setItem(LAST_ACCOUNT_KEY, data.accountId);
        } catch {
          // storage unavailable; the picker just won't remember
        }
      }
      form.reset({ ...form.formState.defaultValues, accountId: data.accountId });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Coffee with a friend" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Paid From</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        accounts.length === 0 ? 'Add an account on the Accounts page' : 'Select an account'
                      }
                    />
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
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex min-w-0 flex-1 flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full overflow-hidden pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem className="flex w-28 flex-col">
                <FormLabel>Time</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          {initialValues ? 'Save Changes' : 'Add Expense'}
        </Button>
      </form>
    </Form>
  );
}
