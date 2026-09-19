'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowRight, ReceiptText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CategoryIcon } from '@/components/CategoryIcon';
import type { Expense } from '@/lib/types';
import { formatInr } from '@/lib/utils';

interface RecentExpensesCardProps {
  expenses: Expense[];
  loading?: boolean;
  limit?: number;
}

export function RecentExpensesCard({
  expenses,
  loading = false,
  limit = 6,
}: RecentExpensesCardProps) {
  const recentExpenses = React.useMemo(
    () => [...expenses].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit),
    [expenses, limit]
  );

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Your latest transactions this month.</CardDescription>
        </div>
        {expenses.length > 0 && (
          <Button asChild variant="ghost" size="sm" className="-mr-2 shrink-0">
            <Link href="/expenses">
              View all
              <ArrowRight />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : recentExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="icon-tile mb-3">
              <ReceiptText className="h-[18px] w-[18px]" />
            </div>
            <p className="text-sm text-muted-foreground">No expenses logged this month.</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link href="/expenses">Add your first expense</Link>
            </Button>
          </div>
        ) : (
          <ul className="-mx-2 divide-y divide-white/6">
            {recentExpenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-white/3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-white/8 bg-white/5 text-muted-foreground">
                  <CategoryIcon category={expense.category} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{expense.description}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {expense.category} · {format(expense.date, 'MMM d, h:mm a')}
                  </p>
                </div>
                <span className="tabular shrink-0 text-sm font-semibold">
                  {formatInr(expense.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
