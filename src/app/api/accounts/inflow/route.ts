import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Money added to accounts in a date range. Only manual credits count:
 * opening balances and transfers between your own accounts are not new money.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const from = new Date(searchParams.get('from') ?? '');
  const to = new Date(searchParams.get('to') ?? '');
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: 'Invalid date range.' }, { status: 400 });
  }

  const result = await prisma.accountTransaction.aggregate({
    where: { userId: session.user.id, type: 'credit', date: { gte: from, lte: to } },
    _sum: { amount: true },
  });

  return NextResponse.json({ total: result._sum.amount ?? 0 });
}
