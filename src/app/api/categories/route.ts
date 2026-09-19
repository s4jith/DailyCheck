import { NextResponse, type NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { categorySchema, firstIssueMessage } from '@/lib/validations';
import { defaultCategories } from '@/lib/types';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
  }

  const name = parsed.data.name;

  if (defaultCategories.some((cat) => cat.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json(
      { error: `"${name}" is already a default category.` },
      { status: 409 }
    );
  }

  const duplicate = await prisma.category.findFirst({
    where: {
      userId: session.user.id,
      name: { equals: name, mode: 'insensitive' },
    },
  });
  if (duplicate) {
    return NextResponse.json({ error: `Category "${duplicate.name}" already exists.` }, { status: 409 });
  }

  try {
    const category = await prisma.category.create({
      data: { name, userId: session.user.id },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    // Unique constraint race between the findFirst check and the create.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: `Category "${name}" already exists.` }, { status: 409 });
    }
    throw error;
  }
}
