import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { OBJECT_ID } from '@/lib/validations';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
  }

  const category = await prisma.category.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!category) {
    return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
  }

  // Refuse to delete a category that expenses or budgets still reference,
  // so no records end up pointing at a category that no longer exists.
  const [expenseCount, budgetCount] = await Promise.all([
    prisma.expense.count({ where: { userId: session.user.id, category: category.name } }),
    prisma.budget.count({ where: { userId: session.user.id, category: category.name } }),
  ]);

  if (expenseCount > 0 || budgetCount > 0) {
    const parts = [
      expenseCount > 0 ? `${expenseCount} expense${expenseCount === 1 ? '' : 's'}` : null,
      budgetCount > 0 ? `${budgetCount} budget${budgetCount === 1 ? '' : 's'}` : null,
    ].filter(Boolean);
    return NextResponse.json(
      { error: `"${category.name}" is still used by ${parts.join(' and ')}.` },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id: category.id } });
  return new NextResponse(null, { status: 204 });
}
