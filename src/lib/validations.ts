import { z } from 'zod';

export const MAX_AMOUNT = 1_000_000_000;

/** A MongoDB ObjectId as it appears in URLs and request bodies. */
export const OBJECT_ID = /^[0-9a-f]{24}$/i;

export const expenseSchema = z.object({
  description: z
    .string()
    .trim()
    .min(2, 'Description must be at least 2 characters.')
    .max(200, 'Description must be at most 200 characters.'),
  amount: z.coerce
    .number()
    .positive('Amount must be a positive number.')
    .max(MAX_AMOUNT, 'Amount is too large.'),
  category: z.string().trim().min(1, 'Please select a category.').max(50),
  date: z.coerce.date(),
  /** Bank account the expense is paid from; `null` for older, unlinked expenses. */
  accountId: z
    .string()
    .regex(OBJECT_ID, 'Please select an account.')
    .nullable()
    .optional(),
});

export const budgetSchema = z.object({
  category: z.string().trim().min(1, 'Please select a category.').max(50),
  amount: z.coerce
    .number()
    .positive('Amount must be a positive number.')
    .max(MAX_AMOUNT, 'Amount is too large.'),
});

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters.')
    .max(40, 'Category name must be at most 40 characters.'),
});

export const savingsGoalSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Goal name must be at least 2 characters.')
    .max(60, 'Goal name must be at most 60 characters.'),
  targetAmount: z.coerce
    .number()
    .positive('Target must be a positive number.')
    .max(MAX_AMOUNT, 'Target is too large.'),
  targetDate: z.coerce.date().optional(),
});

/**
 * Partial update for a goal. `contribute` moves money in (positive) or out
 * (negative) of the goal; `targetDate: null` clears the date.
 */
export const savingsGoalUpdateSchema = z
  .object({
    name: savingsGoalSchema.shape.name.optional(),
    targetAmount: savingsGoalSchema.shape.targetAmount.optional(),
    targetDate: z.coerce.date().nullable().optional(),
    contribute: z.coerce
      .number()
      .min(-MAX_AMOUNT, 'Amount is too large.')
      .max(MAX_AMOUNT, 'Amount is too large.')
      .refine((value) => value !== 0, 'Amount cannot be zero.')
      .optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.targetAmount !== undefined ||
      value.targetDate !== undefined ||
      value.contribute !== undefined,
    { message: 'Nothing to update.' }
  );

const positiveAmount = z.coerce
  .number()
  .positive('Amount must be a positive number.')
  .max(MAX_AMOUNT, 'Amount is too large.');

const optionalNote = z
  .string()
  .trim()
  .max(120, 'Note must be at most 120 characters.')
  .optional()
  .transform((value) => value || undefined);

const accountName = z
  .string()
  .trim()
  .min(2, 'Account name must be at least 2 characters.')
  .max(40, 'Account name must be at most 40 characters.');

export const accountSchema = z.object({
  name: accountName,
  openingBalance: z.coerce
    .number()
    .min(0, 'Opening balance cannot be negative.')
    .max(MAX_AMOUNT, 'Opening balance is too large.')
    .default(0),
});

export const accountUpdateSchema = z.object({ name: accountName });

/** Manual money in (`credit`) or out (`debit`) of one account. */
export const accountAdjustSchema = z.object({
  type: z.enum(['credit', 'debit']),
  amount: positiveAmount,
  note: optionalNote,
  date: z.coerce.date().optional(),
});

export const transferSchema = z
  .object({
    fromId: z.string().regex(OBJECT_ID, 'Choose the account to move money from.'),
    toId: z.string().regex(OBJECT_ID, 'Choose the account to move money to.'),
    amount: positiveAmount,
    note: optionalNote,
  })
  .refine((value) => value.fromId !== value.toId, {
    message: 'Pick two different accounts.',
    path: ['toId'],
  });

// Avatars are stored as data URLs on the user document (see README);
// keep them small so user documents stay well under MongoDB's 16 MB cap.
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export const profileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Display name must be at least 2 characters.')
      .max(50, 'Display name must be at most 50 characters.')
      .optional(),
    image: z
      .string()
      .regex(/^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/, 'Invalid image.')
      .max(Math.ceil((MAX_AVATAR_BYTES * 4) / 3) + 64, 'Image is too large.')
      .optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.image !== undefined,
    { message: 'Nothing to update.' }
  );

export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid request.';
}

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name must be at most 50 characters.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be at most 72 characters.'),
});
