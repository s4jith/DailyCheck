# FinanceFlow 💰

An intuitive personal finance management app built with Next.js. Track your expenses, visualize trends, and manage budgets effortlessly.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix primitives)
- **Auth**: Auth.js (NextAuth v5) with Google sign-in
- **Database**: MongoDB via Prisma ORM v6 (the latest Prisma line with MongoDB support — Prisma 7 is SQL-only for now)
- **Visualization**: Recharts
- **Tooling**: TypeScript, ESLint 9, Vitest

---

## ✨ Features

- 🔐 Google sign-in; every record is owned by and scoped to the signed-in user, enforced server-side
- 📈 Add, view, filter, sort, and delete expenses (with confirmation)
- 🎯 Monthly budgets per category with real monthly spending progress
- 🐷 Savings goals with a target amount (and optional target date): add or withdraw money and track progress
- 📱 Installable PWA with an offline fallback page (manifest + service worker, production builds only)
- 📊 Spending-by-category reports with selectable periods (month / 3 months / year / all time)
- 🏷️ Custom categories with duplicate and in-use protection
- 👤 Profile management: display name, monthly income, and avatar upload (stored as a small data URL on the user document)

---

## 🔧 Getting Started

### Prerequisites

- Node.js 20.9+ (Node 22 recommended)
- A MongoDB database **running as a replica set** — [MongoDB Atlas](https://www.mongodb.com/atlas) free tier works out of the box; for a local instance start `mongod` with `--replSet rs0` and initialize it once with `rs.initiate()`
- Google OAuth 2.0 credentials ([Google Cloud Console](https://console.cloud.google.com/apis/credentials))

### Installation

```bash
git clone https://github.com/MITHRAN-BALACHANDER/FinanceFlow.git
cd FinanceFlow
npm install
```

### Configuration

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your MongoDB connection string.
3. Generate an auth secret: `npx auth secret` (or set `AUTH_SECRET` manually).
4. Create a Google OAuth client (type: Web application) with the redirect URI
   `http://localhost:9002/api/auth/callback/google`, then set
   `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
5. Push the Prisma schema to your database (creates collections and indexes):

```bash
npm run db:push
```

### Run

```bash
npm run dev      # http://localhost:9002
```

### Other scripts

```bash
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm test           # Vitest unit tests
```

---

## 🏗️ Architecture Notes

- All data access happens server-side in route handlers under `src/app/api/*`.
  Every route checks the Auth.js session and scopes queries to the session
  user's id — there is no client-side database access.
- Input is validated with zod schemas shared in `src/lib/validations.ts`.
- Budgets return `spent` computed from the **current month's** expenses.
- Deleting a category is refused while expenses or budgets still reference it.
- Avatars are validated (type + 2 MB limit) and stored as data URLs on the
  user document; swap in object storage (e.g. S3) if you need larger images.
- This app requires a server runtime (API routes + auth), so it cannot be
  deployed to static hosting such as GitHub Pages. Vercel or any Node host
  works; CI runs lint, typecheck, tests, and build on every push.

---

## 🤝 Contributing

Issues and pull requests are welcome.

## 📄 License

MIT

## 👤 Author

[MITHRAN-BALACHANDER](https://github.com/MITHRAN-BALACHANDER)
