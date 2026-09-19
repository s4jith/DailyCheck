'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentExpensesCard } from '@/components/dashboard/RecentExpensesCard';
import { BudgetsCard } from '@/components/dashboard/BudgetsCard';
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart';
import { ArrowDownRight, PiggyBank, Wallet } from 'lucide-react';
import { TotalAmountDialog } from '@/components/dashboard/TotalAmountDialog';
import { useExpenses } from '@/hooks/use-expenses';
import { useBudgets } from '@/hooks/use-budgets';
import { useProfile } from '@/hooks/use-profile';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { currentMonthRange } from '@/lib/dates';
import { formatInr } from '@/lib/utils';

export default function DashboardPage() {
  const monthRange = React.useMemo(() => currentMonthRange(), []);
  const { expenses, loading: expensesLoading } = useExpenses(monthRange);
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { profile, refresh: refreshProfile } = useProfile();
  const { toast } = useToast();

  const handleSetAmount = async ({ totalAmount }: { totalAmount: number }) => {
    try {
      await api('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ monthlyIncome: totalAmount }),
      });
      await refreshProfile();
      toast({ title: 'Success', description: 'Total amount updated.' });
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update total amount.',
      });
      return false;
    }
  };

  const totalAmount = profile?.monthlyIncome ?? 0;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const savings = totalAmount - totalExpenses;

  const spentShare = totalAmount > 0 ? Math.round((totalExpenses / totalAmount) * 100) : null;

  return (
    <div className="animate-rise">
      <PageHeader
        title="Dashboard"
        description={`Your money at a glance — ${format(monthRange.from, 'MMMM yyyy')}`}
      >
        <TotalAmountDialog onSubmit={handleSetAmount} currentAmount={totalAmount} />
      </PageHeader>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          featured
          title="Total Expenses"
          value={formatInr(totalExpenses)}
          icon={ArrowDownRight}
          description={
            spentShare === null
              ? `${expenses.length} transaction${expenses.length === 1 ? '' : 's'} this month`
              : `${spentShare}% of your total amount`
          }
        />
        <StatCard
          title="Total Amount"
          value={formatInr(totalAmount)}
          icon={Wallet}
          description="What you have to work with this month"
        />
        <StatCard
          title="Net Savings"
          value={formatInr(savings)}
          icon={PiggyBank}
          tone={savings < 0 ? 'warning' : 'success'}
          description={
            savings < 0 ? 'You are over your total amount' : 'Left after this month’s spending'
          }
        />
      </div>

      <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-3">
        <SpendingTrendChart
          className="lg:col-span-2"
          data={expenses}
          loading={expensesLoading}
          title="Spending This Month"
          description="Day by day, so you can spot the spikes."
        />
        <BudgetsCard budgets={budgets} loading={budgetsLoading} />
      </div>

      <div className="mt-4 sm:mt-5">
        <RecentExpensesCard expenses={expenses} loading={expensesLoading} />
      </div>
    </div>
  );
}
