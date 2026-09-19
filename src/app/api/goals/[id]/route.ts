import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { savingsGoalUpdateSchema, firstIssueMessage } from '@/lib/validations';

const OBJECT_ID = /^[0-9a-f]{24}$/i;

/** Edits a goal and/or moves money in or out of it (`contribute`). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: 'Goal not found.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = savingsGoalUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
  }

  // Fetching first enforces ownership and lets us validate the new balance.
  const goal = await prisma.savingsGoal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!goal) {
    return NextResponse.json({ error: 'Goal not found.' }, { status: 404 });
  }

  const { name, targetAmount, targetDate, contribute } = parsed.data;

  let savedAmount: number | undefined;
  if (contribute !== undefined) {
    savedAmount = goal.savedAmount + contribute;
    if (savedAmount < 0) {
      return NextResponse.json(
        { error: 'Cannot withdraw more than the saved amount.' },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.savingsGoal.update({
    where: { id: goal.id },
    data: {
      ...(name !== undefined && { name }),
      ...(targetAmount !== undefined && { targetAmount }),
      ...(targetDate !== undefined && { targetDate }),
      ...(savedAmount !== undefined && { savedAmount }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: 'Goal not found.' }, { status: 404 });
  }

  // Scoping the delete by userId enforces ownership server-side.
  const result = await prisma.savingsGoal.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Goal not found.' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
