'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Landmark } from 'lucide-react';

const setFormSchema = z.object({
  totalAmount: z.coerce.number<number>().min(0, 'Amount cannot be negative.'),
});
type SetFormValues = z.infer<typeof setFormSchema>;

const adjustFormSchema = z.object({
  amount: z.coerce
    .number<number>()
    .positive('Enter an amount greater than zero.'),
});
type AdjustFormValues = z.infer<typeof adjustFormSchema>;

interface TotalAmountDialogProps {
  /** Returns true when the update was persisted. */
  onSubmit: (data: { totalAmount: number }) => Promise<boolean>;
  currentAmount?: number;
}

export function TotalAmountDialog({ onSubmit, currentAmount }: TotalAmountDialogProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'set' | 'add' | 'subtract'>('set');
  const total = currentAmount ?? 0;

  const setForm = useForm<SetFormValues>({
    resolver: zodResolver(setFormSchema),
    defaultValues: { totalAmount: total },
  });
  const adjustForm = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustFormSchema),
    defaultValues: { amount: 0 },
  });
  const adjustAmount = useWatch({ control: adjustForm.control, name: 'amount' }) || 0;

  // Keep the forms in sync when the profile loads after first render.
  useEffect(() => {
    setForm.reset({ totalAmount: total });
  }, [total, setForm]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setMode('set');
      adjustForm.reset({ amount: 0 });
    }
  };

  const handleSet = async (data: SetFormValues) => {
    const saved = await onSubmit({ totalAmount: data.totalAmount });
    if (saved) {
      setOpen(false);
    }
  };

  const handleAdjust = async (data: AdjustFormValues) => {
    const delta = mode === 'subtract' ? -data.amount : data.amount;
    const nextTotal = total + delta;
    if (nextTotal < 0) {
      adjustForm.setError('amount', {
        message: 'That would make your total amount negative.',
      });
      return;
    }
    const saved = await onSubmit({ totalAmount: nextTotal });
    if (saved) {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Landmark className="mr-2 h-4 w-4" /> Set Amount
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Total Amount</DialogTitle>
        </DialogHeader>
        <Tabs value={mode === 'set' ? 'set' : 'adjust'} onValueChange={(value) => setMode(value === 'set' ? 'set' : 'add')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="set">Set Total</TabsTrigger>
            <TabsTrigger value="adjust">Add / Subtract</TabsTrigger>
          </TabsList>

          <TabsContent value="set">
            <Form {...setForm}>
              <form onSubmit={setForm.handleSubmit(handleSet)} className="space-y-8">
                <FormField
                  control={setForm.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="2500.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={setForm.formState.isSubmitting}>
                  Save Amount
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="adjust">
            <Form {...adjustForm}>
              <form onSubmit={adjustForm.handleSubmit(handleAdjust)} className="space-y-6">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={mode === 'add' ? 'default' : 'outline'}
                    onClick={() => setMode('add')}
                  >
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant={mode === 'subtract' ? 'default' : 'outline'}
                    onClick={() => setMode('subtract')}
                  >
                    Subtract
                  </Button>
                </div>
                <FormField
                  control={adjustForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount to {mode === 'subtract' ? 'subtract' : 'add'}</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="3000.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-sm text-muted-foreground">
                  Current: ₹{total.toFixed(2)} → New: ₹
                  {Math.max(0, total + (mode === 'subtract' ? -1 : 1) * adjustAmount).toFixed(2)}
                </p>
                <Button type="submit" className="w-full" disabled={adjustForm.formState.isSubmitting}>
                  {mode === 'subtract' ? 'Subtract' : 'Add'} Amount
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
