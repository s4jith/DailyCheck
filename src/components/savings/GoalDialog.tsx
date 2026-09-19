'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, LoaderCircle, Pencil, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { SavingsGoal, SavingsGoalInput } from '@/lib/types';

const goalFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Goal name must be at least 2 characters.')
    .max(60, 'Goal name must be at most 60 characters.'),
  targetAmount: z.coerce.number<number>().positive('Target must be a positive number.'),
  targetDate: z.date().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalDialogProps {
  /** When set, the dialog edits this goal instead of creating a new one. */
  goal?: SavingsGoal;
  /** Returns true when the goal was persisted. */
  onSubmit: (data: SavingsGoalInput) => Promise<boolean>;
}

export function GoalDialog({ goal, onSubmit }: GoalDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = goal !== undefined;

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: goal?.name ?? '',
      targetAmount: goal?.targetAmount ?? 0,
      targetDate: goal?.targetDate ? new Date(goal.targetDate) : undefined,
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      // Re-sync with the latest goal values each time the dialog opens.
      form.reset({
        name: goal?.name ?? '',
        targetAmount: goal?.targetAmount ?? 0,
        targetDate: goal?.targetDate ? new Date(goal.targetDate) : undefined,
      });
    }
  };

  const handleSubmit = async (data: GoalFormValues) => {
    const saved = await onSubmit(data);
    if (saved) {
      setOpen(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit goal ${goal.name}`}>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        ) : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Goal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Goal' : 'New Savings Goal'}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? 'Edit this savings goal' : 'Create a savings goal with a target amount'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Emergency Fund" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="50000.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Target Date (optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
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
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        autoFocus
                      />
                      {field.value && (
                        <div className="border-t p-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => field.onChange(undefined)}
                          >
                            Clear date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEdit ? 'Save Changes' : 'Create Goal'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
