'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
import type { SavingsGoal } from '@/lib/types';

interface MoveMoneyDialogProps {
  goal: SavingsGoal;
  mode: 'add' | 'withdraw';
  /** Receives a signed contribution (negative for withdrawals); returns true on success. */
  onSubmit: (goalId: string, amount: number) => Promise<boolean>;
}

export function MoveMoneyDialog({ goal, mode, onSubmit }: MoveMoneyDialogProps) {
  const [open, setOpen] = useState(false);
  const isWithdraw = mode === 'withdraw';

  const formSchema = z.object({
    amount: z.coerce
      .number<number>()
      .positive('Amount must be a positive number.')
      .refine((value) => !isWithdraw || value <= goal.savedAmount, {
        message: 'Cannot withdraw more than the saved amount.',
      }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 0 },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const saved = await onSubmit(goal.id, isWithdraw ? -data.amount : data.amount);
    if (saved) {
      setOpen(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isWithdraw ? (
          <Button variant="outline" className="flex-1" disabled={goal.savedAmount <= 0}>
            <Minus className="mr-2 h-4 w-4" /> Withdraw
          </Button>
        ) : (
          <Button className="flex-1">
            <Plus className="mr-2 h-4 w-4" /> Add Money
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isWithdraw ? 'Withdraw from' : 'Add money to'} {goal.name}
          </DialogTitle>
          <DialogDescription>
            ₹{goal.savedAmount.toFixed(2)} saved of ₹{goal.targetAmount.toFixed(2)} target.
          </DialogDescription>
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
                    <Input type="number" step="0.01" min="0" placeholder="500.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isWithdraw ? 'Withdraw' : 'Add to Savings'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
