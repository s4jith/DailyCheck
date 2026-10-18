import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { accountErrorResponse, chargeExpense, refundExpense } from '@/lib/accounts';
import { OBJECT_ID, expenseSchema, firstIssueMessage } from '@/lib/validations';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
  }

  // Verify ownership of the expense
  const existing = await prisma.expense.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
  }

  // Omitting accountId keeps the expense on its current account.
  const accountId =
    parsed.data.accountId === undefined ? existing.accountId : parsed.data.accountId;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Create a record of the current state before updating
      await tx.expenseVersion.create({
        data: {
          expenseId: existing.id,
          description: existing.description,
          amount: existing.amount,
          category: existing.category,
          date: existing.date,
          accountId: existing.accountId,
        },
      });

      const next = await tx.expense.update({
        where: { id },
        data: { ...parsed.data, accountId },
      });

      // Undo the old charge, then charge the new amount (possibly to a different account).
      await refundExpense(tx, existing);
      await chargeExpense(tx, next, {
        // An expense already on an archived account can still be edited.
        allowArchived: next.accountId === existing.accountId,
      });

      return next;
    });

    return NextResponse.json(updated);
  } catch (error) {
    return accountErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
  }

  const existing = await prisma.expense.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
  }

  // Deleting an expense puts its money back on the account it was paid from.
  await prisma.$transaction(async (tx) => {
    await refundExpense(tx, existing);
    await tx.expense.delete({ where: { id } });
  });

  return new NextResponse(null, { status: 204 });
}
