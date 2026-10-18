import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { accountErrorResponse, changeBalance, recordTxn } from '@/lib/accounts';
import { OBJECT_ID, accountAdjustSchema, firstIssueMessage } from '@/lib/validations';

/** Adds money to (`credit`) or takes money out of (`debit`) one account. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = accountAdjustSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
  }

  const { type, amount, note, date } = parsed.data;

  try {
    const account = await prisma.$transaction(async (tx) => {
      await changeBalance(tx, {
        userId,
        accountId: id,
        delta: type === 'credit' ? amount : -amount,
      });
      await recordTxn(tx, { userId, accountId: id, type, amount, note, date });
      return tx.bankAccount.findUnique({ where: { id } });
    });
    return NextResponse.json(account);
  } catch (error) {
    return accountErrorResponse(error);
  }
}
