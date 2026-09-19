import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { budgetSchema, firstIssueMessage } from '@/lib/validations';
import { currentMonthRange } from '@/lib/dates';

/**
 * Returns the user's budgets with `spent` computed from the current
 * month's expenses, so budget progress always reflects the month shown
 * on the dashboard.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { from, to } = currentMonthRange();

  const [budgets, spentByCategory] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: session.user.id },
      orderBy: { category: 'asc' },
    }),
    prisma.expense.groupBy({
      by: ['category'],
      where: { userId: session.user.id, date: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
  ]);

  const spentMap = new Map(spentByCategory.map((row) => [row.category, row._sum.amount ?? 0]));

  return NextResponse.json(
    budgets.map((budget) => ({
      ...budget,
      spent: spentMap.get(budget.category) ?? 0,
    }))
  );
}

/** Creates or updates the budget for a category (one budget per category). */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = budgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
  }

  const { category, amount } = parsed.data;
  const budget = await prisma.budget.upsert({
    where: { userId_category: { userId: session.user.id, category } },
    create: { userId: session.user.id, category, amount },
    update: { amount },
  });

  return NextResponse.json(budget);
}
