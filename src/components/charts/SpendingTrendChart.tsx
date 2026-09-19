'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
} from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartTooltip } from './ChartTooltip';
import type { Expense } from '@/lib/types';
import { cn, formatInrShort } from '@/lib/utils';

interface SpendingTrendChartProps {
  data: Expense[];
  loading?: boolean;
  title?: string;
  description?: string;
  height?: number;
  className?: string;
}

type Bucket = { label: string; amount: number; count: number };

/** Day buckets for a short span, month buckets once the span gets long. */
function bucketExpenses(expenses: Expense[]): Bucket[] {
  if (expenses.length === 0) return [];

  const dates = expenses.map((expense) => expense.date.getTime());
  const first = new Date(Math.min(...dates));
  const last = new Date(Math.max(...dates));
  const spansMonths = !isSameMonth(first, last);

  if (spansMonths) {
    return eachMonthOfInterval({ start: startOfMonth(first), end: endOfMonth(last) }).map(
      (month) => {
        const inMonth = expenses.filter((expense) => isSameMonth(expense.date, month));
        return {
          label: format(month, 'MMM yyyy'),
          amount: round(inMonth.reduce((sum, expense) => sum + expense.amount, 0)),
          count: inMonth.length,
        };
      }
    );
  }

  // A single month: show every day so gaps read as "nothing spent", not as a jump.
  return eachDayOfInterval({ start: startOfMonth(first), end: endOfMonth(first) }).map((day) => {
    const onDay = expenses.filter((expense) => isSameDay(expense.date, day));
    return {
      label: format(day, 'MMM d'),
      amount: round(onDay.reduce((sum, expense) => sum + expense.amount, 0)),
      count: onDay.length,
    };
  });
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function SpendingTrendChart({
  data,
  loading = false,
  title = 'Spending Trend',
  description = 'How your spending is spread out.',
  height = 260,
  className,
}: SpendingTrendChartProps) {
  const buckets = React.useMemo(() => bucketExpenses(data), [data]);

  const counts = React.useMemo(
    () => new Map(buckets.map((bucket) => [bucket.label, bucket.count])),
    [buckets]
  );

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="w-full" style={{ height }} />
        ) : buckets.length === 0 ? (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height }}
          >
            Nothing to chart yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={buckets} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="hsl(var(--chart-1))" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="hsl(var(--border))"
                strokeOpacity={0.7}
              />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
                tickMargin={10}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value) => formatInrShort(Number(value))}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--chart-1))', strokeOpacity: 0.45, strokeWidth: 1 }}
                content={
                  <ChartTooltip
                    footer={(label) => {
                      const count = counts.get(label) ?? 0;
                      return count === 0
                        ? 'No transactions'
                        : `${count} transaction${count === 1 ? '' : 's'}`;
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="url(#spendFill)"
                activeDot={{
                  r: 4,
                  fill: 'hsl(var(--chart-1))',
                  stroke: 'hsl(var(--card))',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
