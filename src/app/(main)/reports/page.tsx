'use client';

import * as React from 'react';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { CategorySpendingChart } from '@/components/reports/CategorySpendingChart';
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart';
import { EmptyState } from '@/components/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AreaChart, Receipt, TrendingUp, Trophy } from 'lucide-react';
import { useExpenses } from '@/hooks/use-expenses';
import { periodStart, type ReportPeriod } from '@/lib/dates';
import { formatInr } from '@/lib/utils';

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  'this-month': 'This month',
  'last-3-months': 'Last 3 months',
  'this-year': 'This year',
  'all-time': 'All time',
};

export default function ReportsPage() {
  const [period, setPeriod] = React.useState<ReportPeriod>('this-month');

  const range = React.useMemo(() => {
    const from = periodStart(period);
    return from ? { from } : undefined;
  }, [period]);

  const { expenses, loading, error } = useExpenses(range);

  const summary = React.useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const byCategory = expenses.reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] ?? 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const [topCategory, topAmount] = Object.entries(byCategory).sort(
      (a, b) => b[1] - a[1]
    )[0] ?? ['—', 0];

    return {
      total,
      count: expenses.length,
      average: expenses.length > 0 ? total / expenses.length : 0,
      topCategory,
      topShare: total > 0 ? Math.round((topAmount / total) * 100) : 0,
    };
  }, [expenses]);

  const periodLabel = PERIOD_LABELS[period];

  return (
    <div className="animate-rise">
      <PageHeader title="Reports" description="Where your money actually goes.">
        <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIOD_LABELS) as ReportPeriod[]).map((key) => (
              <SelectItem key={key} value={key}>
                {PERIOD_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/8 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && expenses.length === 0 ? (
        <EmptyState
          icon={AreaChart}
          title="Nothing to report yet"
          description={`No expenses recorded for ${periodLabel.toLowerCase()}. Add a few and your spending breakdown will show up here.`}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              featured
              title="Total Spent"
              value={formatInr(summary.total)}
              icon={TrendingUp}
              description={periodLabel}
            />
            <StatCard
              title="Transactions"
              value={String(summary.count)}
              icon={Receipt}
              description={`Logged in ${periodLabel.toLowerCase()}`}
            />
            <StatCard
              title="Average Expense"
              value={formatInr(summary.average)}
              icon={AreaChart}
              description="Per transaction"
            />
            <StatCard
              title="Top Category"
              value={summary.topCategory}
              icon={Trophy}
              description={`${summary.topShare}% of total spending`}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5">
            <SpendingTrendChart
              data={expenses}
              loading={loading}
              title="Spending Over Time"
              description={`Totals for ${periodLabel.toLowerCase()}.`}
              height={280}
            />
            <CategorySpendingChart data={expenses} loading={loading} periodLabel={periodLabel} />
          </div>
        </>
      )}
    </div>
  );
}
