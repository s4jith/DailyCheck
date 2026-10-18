import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { OBJECT_ID } from '@/lib/validations';

const PAGE_SIZE = 100;

/** An account's balance history, newest first. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const transactions = await prisma.accountTransaction.findMany({
    where: { accountId: id, userId: session.user.id },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: PAGE_SIZE,
  });

  return NextResponse.json(transactions);
}
