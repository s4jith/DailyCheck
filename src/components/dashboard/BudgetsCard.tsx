'use client';

import Link from 'next/link';
import { AlertTriangle, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '../ui/scroll-area';
import type { BudgetWithSpent } from '@/lib/types';
import { budgetBarClass, budgetStatus, budgetTextClass } from '@/lib/budget-status';
import { cn, formatInr } from '@/lib/utils';

interface BudgetsCardProps {
  budgets: BudgetWithSpent[];
  loading?: boolean;
}

export function BudgetsCard({ budgets, loading = false }: BudgetsCardProps) {
  const overCount = budgets.filter(
    (budget) => budgetStatus(budget.spent, budget.amount).health === 'over'
  ).length;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Budgets</CardTitle>
        <CardDescription>
          {overCount > 0
            ? `${overCount} budget${overCount === 1 ? '' : 's'} over the limit.`
            : 'Your spending progress this month.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center">
            <div className="icon-tile mb-3">
              <Target className="h-[18px] w-[18px]" />
            </div>
            <p className="text-sm text-muted-foreground">No budgets set yet.</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/budgets">Create a budget</Link>
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[292px] pr-3">
            <div className="space-y-5">
              {budgets.map((budget) => {
                const { health, progress, remaining } = budgetStatus(budget.spent, budget.amount);

                return (
                  <div key={budget.id}>
                    <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
                      <span className="flex items-center gap-1.5 truncate font-medium">
                        {health === 'over' && (
                          <AlertTriangle
                            className="h-3.5 w-3.5 shrink-0 text-destructive"
                            aria-hidden
                          />
                        )}
                        {budget.category}
                      </span>
                      <span className={cn('tabular shrink-0 text-xs', budgetTextClass[health])}>
                        {formatInr(budget.spent)}
                        <span className="text-muted-foreground"> / {formatInr(budget.amount)}</span>
                      </span>
                    </div>
                    <Progress value={progress} indicatorClassName={budgetBarClass[health]} />
                    {health === 'over' && (
                      <p className="mt-1.5 text-xs text-destructive">
                        Over by {formatInr(Math.abs(remaining))}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
