import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';

/** Login JWT lifetime: 7 days. */
const SEVEN_DAYS = 7 * 24 * 60 * 60;

/** Wrong passwords allowed in a row before the account is locked for a while. */
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

// Compared against when the email is unknown, so a miss takes as long as a
// wrong password and response times don't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Needed on any host other than Vercel (Render, Railway, a VPS, `next start`),
  // where Auth.js otherwise rejects every request as coming from an untrusted host.
  trustHost: true,
  session: { strategy: 'jwt', maxAge: SEVEN_DAYS },
  jwt: { maxAge: SEVEN_DAYS },
  pages: { signIn: '/' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user?.passwordHash) return null;
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        if (!ok) {
          const failedLogins = user.failedLogins + 1;
          await prisma.user.update({
            where: { id: user.id },
            data:
              failedLogins >= MAX_FAILED_LOGINS
                ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MS) }
                : { failedLogins },
          });
          return null;
        }

        if (user.failedLogins > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLogins: 0, lockedUntil: null },
          });
        }

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
