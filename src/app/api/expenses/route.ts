import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { expenseSchema, firstIssueMessage } from '@/lib/validations';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) {
    const parsed = new Date(from);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid "from" date.' }, { status: 400 });
    }
    dateFilter.gte = parsed;
  }
  if (to) {
    const parsed = new Date(to);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid "to" date.' }, { status: 400 });
    }
    dateFilter.lte = parsed;
  }

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      ...(dateFilter.gte || dateFilter.lte ? { date: dateFilter } : {}),
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(expenses);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json(expense, { status: 201 });
}
