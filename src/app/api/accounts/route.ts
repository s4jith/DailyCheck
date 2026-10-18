import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { recordTxn } from '@/lib/accounts';
import { accountSchema, firstIssueMessage } from '@/lib/validations';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await prisma.bankAccount.findMany({
    where: { userId: session.user.id, archived: false },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(accounts);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
  }

  const { name, openingBalance } = parsed.data;

  try {
    const account = await prisma.$transaction(async (tx) => {
      const created = await tx.bankAccount.create({
        data: { userId, name, balance: openingBalance },
      });
      if (openingBalance > 0) {
        await recordTxn(tx, {
          userId,
          accountId: created.id,
          type: 'opening',
          amount: openingBalance,
          note: 'Opening balance',
        });
      }
      return created;
    });
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        { error: `You already have an account named "${name}".` },
        { status: 409 }
      );
    }
    throw error;
  }
}
