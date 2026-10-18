import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

type Tx = Prisma.TransactionClient;

/** Balance change kinds stored on `AccountTransaction.type`. */
type TxnType = 'opening' | 'credit' | 'debit' | 'transfer_in' | 'transfer_out' | 'expense';

/** Thrown inside a transaction to abort it with a user-facing message. */
export class AccountError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'AccountError';
  }
}

// Float sums like 0.1 + 0.2 must not trip the "not enough balance" check.
const EPSILON = 0.005;

/**
 * Adds `delta` (negative to withdraw) to an account the user owns.
 * Withdrawals are refused when they would take the balance below zero, and
 * new money can only leave an active account; refunds may land on an archived one.
 */
export async function changeBalance(
  tx: Tx,
  { userId, accountId, delta, allowArchived = false }: {
    userId: string;
    accountId: string;
    delta: number;
    allowArchived?: boolean;
  }
) {
  const where: Prisma.BankAccountWhereInput = {
    id: accountId,
    userId,
    ...(allowArchived ? {} : { archived: false }),
  };

  if (delta < 0) {
    where.balance = { gte: -delta - EPSILON };
  }

  const result = await tx.bankAccount.updateMany({
    where,
    data: { balance: { increment: delta } },
  });

  if (result.count === 1) return;

  const account = await tx.bankAccount.findFirst({ where: { id: accountId, userId } });
  if (!account || (account.archived && !allowArchived)) {
    throw new AccountError(404, 'Account not found.');
  }
  throw new AccountError(
    400,
    `Not enough balance in ${account.name} (₹${account.balance.toFixed(2)} available).`
  );
}

/** Logs a balance change on an account's history. */
export function recordTxn(
  tx: Tx,
  data: {
    userId: string;
    accountId: string;
    type: TxnType;
    amount: number;
    note?: string | null;
    date?: Date;
    expenseId?: string;
    transferId?: string;
  }
) {
  return tx.accountTransaction.create({ data });
}

/** Charges an expense to its account and logs it. */
export async function chargeExpense(
  tx: Tx,
  expense: { id: string; userId: string; accountId: string | null; amount: number; description: string; date: Date },
  { allowArchived = false } = {}
) {
  if (!expense.accountId) return;
  await changeBalance(tx, {
    userId: expense.userId,
    accountId: expense.accountId,
    delta: -expense.amount,
    allowArchived,
  });
  await recordTxn(tx, {
    userId: expense.userId,
    accountId: expense.accountId,
    type: 'expense',
    amount: expense.amount,
    note: expense.description,
    date: expense.date,
    expenseId: expense.id,
  });
}

/** Puts an expense's money back on its account and drops its history entry. */
export async function refundExpense(
  tx: Tx,
  expense: { id: string; userId: string; accountId: string | null; amount: number }
) {
  if (expense.accountId) {
    await changeBalance(tx, {
      userId: expense.userId,
      accountId: expense.accountId,
      delta: expense.amount,
      allowArchived: true,
    });
  }
  await tx.accountTransaction.deleteMany({ where: { expenseId: expense.id } });
}

/** Turns an `AccountError` into its JSON response; rethrows anything else. */
export function accountErrorResponse(error: unknown) {
  if (error instanceof AccountError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  throw error;
}
