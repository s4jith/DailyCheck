import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { firstIssueMessage, registerSchema } from '@/lib/validations';

/**
 * This is a single-owner app: the first sign-up creates the owner, and after
 * that sign-ups are closed unless ALLOW_SIGNUPS=true is set.
 */
export async function POST(request: NextRequest) {
  if (process.env.ALLOW_SIGNUPS !== 'true' && (await prisma.user.count()) > 0) {
    return NextResponse.json({ error: 'Sign-ups are closed.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error) }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists.' },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { name, email, passwordHash } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
