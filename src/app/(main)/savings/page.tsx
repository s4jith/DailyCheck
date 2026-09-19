'use client';

import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { PiggyBank } from 'lucide-react';
import { GoalCard } from '@/components/savings/GoalCard';
import { GoalDialog } from '@/components/savings/GoalDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useSavingsGoals } from '@/hooks/use-savings-goals';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { SavingsGoal, SavingsGoalInput } from '@/lib/types';
import { formatInr } from '@/lib/utils';

export default function SavingsPage() {
  const { goals, loading, error, refresh } = useSavingsGoals();
  const { toast } = useToast();

  const report = (err: unknown, fallback: string) => {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: err instanceof Error ? err.message : fallback,
    });
  };

  const createGoal = async (data: SavingsGoalInput) => {
    try {
      await api('/api/goals', { method: 'POST', body: JSON.stringify(data) });
      toast({ title: 'Success', description: `Goal "${data.name}" created.` });
      await refresh();
      return true;
    } catch (err) {
      report(err, 'Failed to create goal.');
      return false;
    }
  };

  const editGoal = async (goalId: string, data: SavingsGoalInput) => {
    try {
      await api(`/api/goals/${goalId}`, {
        method: 'PATCH',
        // `null` clears a previously set target date.
        body: JSON.stringify({ ...data, targetDate: data.targetDate ?? null }),
      });
      toast({ title: 'Success', description: 'Goal updated.' });
      await refresh();
      return true;
    } catch (err) {
      report(err, 'Failed to update goal.');
      return false;
    }
  };

  const contribute = async (goalId: string, amount: number) => {
    try {
      await api(`/api/goals/${goalId}`, {
        method: 'PATCH',
        body: JSON.stringify({ contribute: amount }),
      });
      toast({
        title: 'Success',
        description:
          amount >= 0
            ? `${formatInr(amount)} added to savings.`
            : `${formatInr(Math.abs(amount))} withdrawn.`,
      });
      await refresh();
      return true;
    } catch (err) {
      report(err, 'Failed to update savings.');
      return false;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await api(`/api/goals/${goalId}`, { method: 'DELETE' });
      toast({ title: 'Success', description: 'Goal deleted.' });
      await refresh();
    } catch (err) {
      report(err, 'Failed to delete goal.');
    }
  };

  const totalSaved = goals.reduce((sum, goal) => sum + goal.savedAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  const overallProgress = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  return (
    <div className="animate-rise">
      <PageHeader
        title="Savings Goals"
        description="Name the thing you are saving for, then chip away at it."
      >
        <GoalDialog onSubmit={createGoal} />
      </PageHeader>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/8 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-60 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {goals.length > 0 && (
            <Card className="mb-4 sm:mb-5">
              <CardContent className="space-y-3 pt-5 sm:pt-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total saved across {goals.length} goal{goals.length === 1 ? '' : 's'}
                  </span>
                  <span className="tabular font-headline text-xl font-bold tracking-tight">
                    {formatInr(totalSaved)}
                    <span className="text-sm font-normal text-muted-foreground">
                      {' '}
                      of {formatInr(totalTarget)}
                    </span>
                  </span>
                </div>
                <Progress value={overallProgress} indicatorClassName="bg-success" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(overallProgress)}% of the way there
                </p>
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal: SavingsGoal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={editGoal}
                onContribute={contribute}
                onDelete={deleteGoal}
              />
            ))}
          </div>
          {goals.length === 0 && (
            <EmptyState
              icon={PiggyBank}
              title="No savings goals yet"
              description="Set a target — a trip, a gadget, a rainy-day fund — and put money aside for it."
              action={<GoalDialog onSubmit={createGoal} />}
            />
          )}
        </>
      )}
    </div>
  );
}
