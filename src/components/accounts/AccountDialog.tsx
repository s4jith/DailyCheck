'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { LoaderCircle, Pencil, PlusCircle } from 'lucide-react';
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

const accountFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Account name must be at least 2 characters.')
    .max(40, 'Account name must be at most 40 characters.'),
  openingBalance: z.coerce.number<number>().min(0, 'Opening balance cannot be negative.'),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountDialogProps {
  /** When set, the dialog renames this account instead of creating one. */
  account?: BankAccount;
  /** Returns true when the account was saved. */
  onSubmit: (data: AccountFormValues) => Promise<boolean>;
}

export function AccountDialog({ account, onSubmit }: AccountDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = account !== undefined;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { name: account?.name ?? '', openingBalance: 0 },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      form.reset({ name: account?.name ?? '', openingBalance: 0 });
    }
  };

  const handleSubmit = async (data: AccountFormValues) => {
    const saved = await onSubmit(data);
    if (saved) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Rename ${account.name}`}
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Rename Account' : 'New Bank Account'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Change how this account is labelled.'
              : 'Add an account and the money currently in it.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., HDFC Savings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEdit && (
              <FormField
                control={form.control}
                name="openingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Balance</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="25000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? 'Save Name' : 'Add Account'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
