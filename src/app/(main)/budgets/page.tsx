'use client';

import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { Target } from 'lucide-react';
import { AddBudgetDialog } from '@/components/budgets/AddBudgetDialog';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useBudgets } from '@/hooks/use-budgets';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import type { Budget } from '@/lib/types';

export default function BudgetsPage() {
  const { budgets, loading, error, refresh } = useBudgets();
  const { toast } = useToast();

  const saveBudget = async (budget: Omit<Budget, 'id'>) => {
    try {
      await api('/api/budgets', { method: 'PUT', body: JSON.stringify(budget) });
      toast({ title: 'Success', description: `Budget for ${budget.category} saved.` });
      await refresh();
      return true;
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save budget.',
      });
      return false;
    }
  };

  return (
    <div className="animate-rise">
      <PageHeader
        title="Budgets"
        description="Set a monthly cap per category and watch the gap close."
      >
        <AddBudgetDialog onSubmit={saveBudget} />
      </PageHeader>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/8 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {loading ? (
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} />
            ))}
          </div>
          {budgets.length === 0 && (
            <EmptyState
              icon={Target}
              title="No budgets yet"
              description="Pick a category, set a monthly limit, and FinanceFlow will track what is left."
              action={<AddBudgetDialog onSubmit={saveBudget} />}
            />
          )}
        </>
      )}
    </div>
  );
}
