import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { OBJECT_ID, accountUpdateSchema, firstIssueMessage } from '@/lib/validations';

/** Renames an account. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = accountUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
  }

  try {
    const result = await prisma.bankAccount.updateMany({
      where: { id, userId: session.user.id, archived: false },
      data: { name: parsed.data.name },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: `You already have an account named "${parsed.data.name}".` },
        { status: 409 }
      );
    }
    throw error;
  }

  const account = await prisma.bankAccount.findUnique({ where: { id } });
  return NextResponse.json(account);
}

/**
 * Removes an account. Only an empty account can go; one that still has
 * expenses pointing at it is archived instead so their history keeps its name.
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const account = await prisma.bankAccount.findFirst({
    where: { id, userId: session.user.id, archived: false },
  });
  if (!account) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  if (Math.abs(account.balance) >= 0.005) {
    return NextResponse.json(
      { error: 'Move or subtract the remaining balance before deleting this account.' },
      { status: 400 }
    );
  }

  const linkedExpenses = await prisma.expense.count({ where: { accountId: id } });
  if (linkedExpenses > 0) {
    await prisma.bankAccount.update({ where: { id }, data: { archived: true } });
    return NextResponse.json({ archived: true });
  }

  await prisma.bankAccount.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
