import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { AccountError, accountErrorResponse, changeBalance, recordTxn } from '@/lib/accounts';
import { firstIssueMessage, transferSchema } from '@/lib/validations';

/** Moves money between two of the user's accounts; the total stays the same. */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  const parsed = transferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
  }

  const { fromId, toId, amount, note } = parsed.data;
  const transferId = randomUUID();

  try {
    await prisma.$transaction(async (tx) => {
      const [from, to] = await Promise.all([
        tx.bankAccount.findFirst({ where: { id: fromId, userId, archived: false } }),
        tx.bankAccount.findFirst({ where: { id: toId, userId, archived: false } }),
      ]);
      if (!from || !to) {
        throw new AccountError(404, 'Account not found.');
      }

      await changeBalance(tx, { userId, accountId: fromId, delta: -amount });
      await changeBalance(tx, { userId, accountId: toId, delta: amount });

      const date = new Date();
      await recordTxn(tx, {
        userId,
        accountId: fromId,
        type: 'transfer_out',
        amount,
        note: note ?? `To ${to.name}`,
        date,
        transferId,
      });
      await recordTxn(tx, {
        userId,
        accountId: toId,
        type: 'transfer_in',
        amount,
        note: note ?? `From ${from.name}`,
        date,
        transferId,
      });
    });
  } catch (error) {
    return accountErrorResponse(error);
  }

  return NextResponse.json({ ok: true });
}
