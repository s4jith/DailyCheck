import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const OBJECT_ID = /^[0-9a-f]{24}$/i;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
  }

  // Verify ownership of the parent expense first
  const expense = await prisma.expense.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!expense) {
    return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
  }

  const history = await prisma.expenseVersion.findMany({
    where: { expenseId: id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(history);
}
