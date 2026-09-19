'use client';

import { useState } from 'react';
import { differenceInCalendarDays, format } from 'date-fns';
import { CalendarClock, CheckCircle2, LoaderCircle, PiggyBank, Trash2 } from 'lucide-react';
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
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GoalDialog } from '@/components/savings/GoalDialog';
import { MoveMoneyDialog } from '@/components/savings/MoveMoneyDialog';
import type { SavingsGoal, SavingsGoalInput } from '@/lib/types';
import { cn, formatInr } from '@/lib/utils';

interface GoalCardProps {
  goal: SavingsGoal;
  onEdit: (goalId: string, data: SavingsGoalInput) => Promise<boolean>;
  onContribute: (goalId: string, amount: number) => Promise<boolean>;
  onDelete: (goalId: string) => Promise<void>;
}

export function GoalCard({ goal, onEdit, onContribute, onDelete }: GoalCardProps) {
  const [deleting, setDeleting] = useState(false);

  const progress =
    goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0;
  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
  const reached = goal.savedAmount >= goal.targetAmount;
  const targetDate = goal.targetDate ? new Date(goal.targetDate) : null;
  const daysLeft = targetDate ? differenceInCalendarDays(targetDate, new Date()) : null;
  const overdue = !reached && daysLeft !== null && daysLeft < 0;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(goal.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                'icon-tile',
                reached && 'border-success/25 bg-success/10 text-success'
              )}
            >
              <PiggyBank className="h-[18px] w-[18px]" />
            </span>
            <p className="truncate font-headline font-semibold tracking-tight">{goal.name}</p>
          </div>
          <div className="flex shrink-0 items-center">
            <GoalDialog goal={goal} onSubmit={(data) => onEdit(goal.id, data)} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive"
                  disabled={deleting}
                  aria-label={`Delete goal ${goal.name}`}
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
                  <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &ldquo;{goal.name}&rdquo; and its saved progress of{' '}
                    {formatInr(goal.savedAmount)} will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <p className="tabular pt-3 font-headline text-2xl font-bold tracking-tight">
          {formatInr(goal.savedAmount)}
          <span className="text-sm font-normal text-muted-foreground">
            {' '}
            of {formatInr(goal.targetAmount)}
          </span>
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <Progress
          value={progress}
          indicatorClassName={reached ? 'bg-success' : 'bg-primary'}
        />
        <div className="flex items-center justify-between gap-2 text-xs">
          {reached ? (
            <span className="flex items-center gap-1.5 font-medium text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Goal reached
            </span>
          ) : (
            <span className="tabular text-muted-foreground">
              {formatInr(remaining)} to go
            </span>
          )}
          <span className="tabular font-medium text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        {targetDate && (
          <p
            className={cn(
              'flex items-center gap-1.5 text-xs text-muted-foreground',
              overdue && 'text-warning'
            )}
          >
            <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {format(targetDate, 'PP')}
            {!reached &&
              daysLeft !== null &&
              (daysLeft > 0
                ? ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
                : daysLeft === 0
                  ? ' · due today'
                  : ' · past due')}
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <MoveMoneyDialog goal={goal} mode="add" onSubmit={onContribute} />
        <MoveMoneyDialog goal={goal} mode="withdraw" onSubmit={onContribute} />
      </CardFooter>
    </Card>
  );
}
