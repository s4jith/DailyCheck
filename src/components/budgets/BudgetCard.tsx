import { AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CategoryIcon } from '@/components/CategoryIcon';
import { budgetBarClass, budgetStatus, budgetTextClass } from '@/lib/budget-status';
import type { BudgetWithSpent } from '@/lib/types';
import { cn, formatInr } from '@/lib/utils';

interface BudgetCardProps {
  budget: BudgetWithSpent;
}

export function BudgetCard({ budget }: BudgetCardProps) {
  const { health, progress, remaining, share } = budgetStatus(budget.spent, budget.amount);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="icon-tile">
              <CategoryIcon category={budget.category} className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-headline font-semibold tracking-tight">
                {budget.category}
              </p>
              <p className="text-xs text-muted-foreground">Monthly budget</p>
            </div>
          </div>
          <p className="tabular shrink-0 font-headline text-lg font-bold tracking-tight">
            {formatInr(budget.amount)}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progress} indicatorClassName={budgetBarClass[health]} />
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="tabular text-muted-foreground">
            {formatInr(budget.spent)} spent
          </span>
          <span className={cn('tabular flex items-center gap-1 font-medium', budgetTextClass[health])}>
            {health === 'over' && <AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
            {remaining >= 0
              ? `${formatInr(remaining)} left`
              : `${formatInr(Math.abs(remaining))} over`}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{Math.round(share)}% of budget used</p>
      </CardContent>
    </Card>
  );
}
