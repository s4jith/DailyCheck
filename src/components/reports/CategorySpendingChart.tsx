'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { ChartTooltip } from '../charts/ChartTooltip';
import type { Expense } from '@/lib/types';
import { formatInrShort } from '@/lib/utils';

interface CategorySpendingChartProps {
  data: Expense[];
  loading?: boolean;
  periodLabel?: string;
}

export function CategorySpendingChart({
  data,
  loading = false,
  periodLabel = 'the selected period',
}: CategorySpendingChartProps) {
  const chartData = useMemo(() => {
    const categoryTotals = data.reduce(
      (acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(categoryTotals)
      .map(([name, amount]) => ({
        name,
        amount: parseFloat(amount.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [data]);

  const total = useMemo(
    () => chartData.reduce((sum, row) => sum + row.amount, 0),
    [chartData]
  );

  const shares = useMemo(
    () =>
      new Map(
        chartData.map((row) => [
          row.name,
          total > 0 ? Math.round((row.amount / total) * 100) : 0,
        ])
      ),
    [chartData, total]
  );

  // Ranked bars need room to breathe; grow the plot with the category count.
  const height = Math.max(220, chartData.length * 44 + 24);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>
          Ranked highest to lowest — {periodLabel.toLowerCase()}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[320px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            No expenses in this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 64, left: 4, bottom: 4 }}
              barCategoryGap={12}
            >
              <CartesianGrid
                horizontal={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.7}
              />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatInrShort(Number(value))}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={96}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--foreground) / 0.04)' }}
                content={
                  <ChartTooltip
                    footer={(label) => {
                      const share = shares.get(label);
                      return share === undefined ? null : `${share}% of total spending`;
                    }}
                  />
                }
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {chartData.map((row) => (
                  <Cell key={row.name} fill="hsl(var(--chart-1))" />
                ))}
                <LabelList
                  dataKey="amount"
                  position="right"
                  offset={10}
                  fontSize={11}
                  fill="hsl(var(--muted-foreground))"
                  formatter={(value) => formatInrShort(Number(value ?? 0))}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
