# DailyCheck 💰

A personal finance app built with Next.js. Log your expenses, keep an eye on budgets, chase savings goals, and see where your money goes — in a dark, fast, installable interface.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix primitives), Space Grotesk + Instrument Sans
- **Auth**: Auth.js (NextAuth v5) with email + password login (bcrypt-hashed, 7-day JWT session)
- **Database**: MongoDB via Prisma ORM v6 (the latest Prisma line with MongoDB support — Prisma 7 is SQL-only for now)
- **Visualization**: Recharts
- **Tooling**: TypeScript, ESLint 9, Vitest

---

## ✨ Features

- 🔐 Email/password login with a 7-day JWT; every record is owned by and scoped to the signed-in user, enforced server-side
- 🏠 Dashboard with total expenses, total amount and net savings for the month, a daily spending trend, budget progress and recent transactions
- 💵 Set your total amount directly, or add to / subtract from it
- 📈 Add, edit, view, filter, sort, and delete expenses (with confirmation and per-expense version history)
- 🎯 Monthly budgets per category with real spending progress — flagged when nearing or over the limit
- 🐷 Savings goals with a target amount (and optional target date): add or withdraw money and track progress
- 📊 Reports with selectable periods (month / 3 months / year / all time): summary stats, spending over time, and a ranked spending-by-category chart
- 🏷️ Custom categories with duplicate and in-use protection
- 👤 Profile management: display name and avatar upload (stored as a small data URL on the user document)
- 📱 Installable PWA with an offline fallback page (manifest + service worker, production builds only)

---

## 🔧 Getting Started

### Prerequisites

- Node.js 20.9+ (Node 22 recommended)
- A MongoDB database **running as a replica set** — [MongoDB Atlas](https://www.mongodb.com/atlas) free tier works out of the box; for a local instance start `mongod` with `--replSet rs0` and initialize it once with `rs.initiate()`

### Installation

```bash
git clone https://github.com/s4jith/DailyCheck.git
cd DailyCheck
npm install
```

### Configuration

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your MongoDB connection string.
3. Generate an auth secret: `npx auth secret` (or set `AUTH_SECRET` manually).
4. Push the Prisma schema to your database (creates collections and indexes):

```bash
npm run db:push
```

`.env` is git-ignored — never commit it. Only `.env.example` is tracked.

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
- The dashboard's "total amount" is the sum of your bank account balances
  (`BankAccount`). Every balance change — manual add/subtract, transfer, or an
  expense paid from the account — is written together with an
  `AccountTransaction` history row inside one database transaction.
- The theme is a single dark palette defined once as CSS variables in
  `src/app/globals.css`; components use the tokens (`bg-card`, `text-primary`,
  `text-success`, …) rather than hard-coded colours, so a re-skin is a
  one-file change.
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

[s4jith](https://github.com/s4jith)
