'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentExpensesCard } from '@/components/dashboard/RecentExpensesCard';
import { BudgetsCard } from '@/components/dashboard/BudgetsCard';
import { SpendingTrendChart } from '@/components/charts/SpendingTrendChart';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, Landmark, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/use-expenses';
import { useBudgets } from '@/hooks/use-budgets';
import { useAccounts } from '@/hooks/use-accounts';
import { useInflow } from '@/hooks/use-inflow';
import { currentMonthRange } from '@/lib/dates';
import { formatInr } from '@/lib/utils';

export default function DashboardPage() {
  const monthRange = React.useMemo(() => currentMonthRange(), []);
  const { expenses, loading: expensesLoading } = useExpenses(monthRange);
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { accounts, total: totalAmount } = useAccounts();
  const { total: moneyIn } = useInflow(monthRange);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="animate-rise">
      <PageHeader
        title="Dashboard"
        description={`Your money at a glance — ${format(monthRange.from, 'MMMM yyyy')}`}
      >
        <Button variant="outline" asChild>
          <Link href="/accounts">
            <Landmark className="mr-2 h-4 w-4" /> Manage Accounts
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          featured
          title="Total Expenses"
          value={formatInr(totalExpenses)}
          icon={ArrowDownRight}
          description={`${expenses.length} transaction${expenses.length === 1 ? '' : 's'} this month`}
        />
        <StatCard
          title="Total Amount"
          value={formatInr(totalAmount)}
          icon={Wallet}
          description={
            accounts.length === 0
              ? 'Add your bank accounts to see your total'
              : `Across ${accounts.length} bank account${accounts.length === 1 ? '' : 's'}`
          }
        />
        <StatCard
          title="Money In"
          value={formatInr(moneyIn)}
          icon={ArrowUpRight}
          tone="success"
          description="Added to your accounts this month"
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
