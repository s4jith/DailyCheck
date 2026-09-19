import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { expenseSchema, firstIssueMessage } from '@/lib/validations';

const OBJECT_ID = /^[0-9a-f]{24}$/i;

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

  // Create a record of the current state before updating
  await prisma.expenseVersion.create({
    data: {
      expenseId: existing.id,
      description: existing.description,
      amount: existing.amount,
      category: existing.category,
      date: existing.date,
    },
  });

  // Update the expense
  const updated = await prisma.expense.update({
    where: { id },
    data: parsed.data,
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
    return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
  }

  // Scoping the delete by userId enforces ownership server-side.
  const result = await prisma.expense.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
