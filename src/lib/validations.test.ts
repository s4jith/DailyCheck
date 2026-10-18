import { describe, expect, it } from 'vitest';
import {
  accountAdjustSchema,
  accountSchema,
  budgetSchema,
  categorySchema,
  expenseSchema,
  profileSchema,
  savingsGoalSchema,
  savingsGoalUpdateSchema,
  transferSchema,
} from './validations';

describe('expenseSchema', () => {
  const valid = {
    description: 'Coffee',
    amount: 4.5,
    category: 'Food',
    date: '2026-07-19T10:00:00.000Z',
  };

  it('accepts a valid expense and coerces the date', () => {
    const parsed = expenseSchema.parse(valid);
    expect(parsed.date).toBeInstanceOf(Date);
    expect(parsed.amount).toBe(4.5);
  });

  it('rejects non-positive amounts', () => {
    expect(expenseSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...valid, amount: -5 }).success).toBe(false);
  });

  it('rejects a too-short description and trims whitespace', () => {
    expect(expenseSchema.safeParse({ ...valid, description: 'a' }).success).toBe(false);
    expect(expenseSchema.parse({ ...valid, description: '  Lunch  ' }).description).toBe('Lunch');
  });

  it('strips unknown fields such as time', () => {
    const parsed = expenseSchema.parse({ ...valid, time: '10:30' });
    expect('time' in parsed).toBe(false);
  });
});

describe('budgetSchema', () => {
  it('requires a category and a positive amount', () => {
    expect(budgetSchema.safeParse({ category: 'Food', amount: 100 }).success).toBe(true);
    expect(budgetSchema.safeParse({ category: '', amount: 100 }).success).toBe(false);
    expect(budgetSchema.safeParse({ category: 'Food', amount: -1 }).success).toBe(false);
  });
});

describe('categorySchema', () => {
  it('trims and bounds the name', () => {
    expect(categorySchema.parse({ name: '  Subscriptions ' }).name).toBe('Subscriptions');
    expect(categorySchema.safeParse({ name: 'x' }).success).toBe(false);
    expect(categorySchema.safeParse({ name: 'y'.repeat(41) }).success).toBe(false);
  });
});

describe('savingsGoalSchema', () => {
  it('accepts a goal with and without a target date', () => {
    expect(savingsGoalSchema.safeParse({ name: 'Emergency Fund', targetAmount: 50000 }).success).toBe(true);
    const parsed = savingsGoalSchema.parse({
      name: 'Trip',
      targetAmount: 20000,
      targetDate: '2026-12-31T00:00:00.000Z',
    });
    expect(parsed.targetDate).toBeInstanceOf(Date);
  });

  it('rejects short names and non-positive targets', () => {
    expect(savingsGoalSchema.safeParse({ name: 'x', targetAmount: 100 }).success).toBe(false);
    expect(savingsGoalSchema.safeParse({ name: 'Trip', targetAmount: 0 }).success).toBe(false);
    expect(savingsGoalSchema.safeParse({ name: 'Trip', targetAmount: -5 }).success).toBe(false);
  });
});

describe('savingsGoalUpdateSchema', () => {
  it('rejects an empty update', () => {
    expect(savingsGoalUpdateSchema.safeParse({}).success).toBe(false);
  });

  it('accepts contributions and withdrawals but not zero', () => {
    expect(savingsGoalUpdateSchema.safeParse({ contribute: 500 }).success).toBe(true);
    expect(savingsGoalUpdateSchema.safeParse({ contribute: -200 }).success).toBe(true);
    expect(savingsGoalUpdateSchema.safeParse({ contribute: 0 }).success).toBe(false);
  });

  it('accepts partial edits and clearing the target date', () => {
    expect(savingsGoalUpdateSchema.safeParse({ name: 'New Car' }).success).toBe(true);
    expect(savingsGoalUpdateSchema.safeParse({ targetAmount: 75000 }).success).toBe(true);
    expect(savingsGoalUpdateSchema.safeParse({ targetDate: null }).success).toBe(true);
  });
});

describe('profileSchema', () => {
  it('rejects an empty update', () => {
    expect(profileSchema.safeParse({}).success).toBe(false);
  });

  it('accepts partial updates', () => {
    expect(profileSchema.safeParse({ name: 'Alex' }).success).toBe(true);
  });

  it('rejects non-image data URLs', () => {
    expect(profileSchema.safeParse({ image: 'data:text/html;base64,PGI+' }).success).toBe(false);
    expect(profileSchema.safeParse({ image: 'https://example.com/a.png' }).success).toBe(false);
  });

  it('accepts a valid image data URL', () => {
    expect(
      profileSchema.safeParse({ image: 'data:image/png;base64,iVBORw0KGgo=' }).success
    ).toBe(true);
  });
});

const ID_A = '0123456789abcdef01234567';
const ID_B = '89abcdef0123456789abcdef';

describe('accountSchema', () => {
  it('defaults the opening balance to zero', () => {
    expect(accountSchema.parse({ name: 'HDFC Savings' }).openingBalance).toBe(0);
  });

  it('rejects short names and negative opening balances', () => {
    expect(accountSchema.safeParse({ name: 'H' }).success).toBe(false);
    expect(accountSchema.safeParse({ name: 'HDFC', openingBalance: -1 }).success).toBe(false);
  });
});

describe('accountAdjustSchema', () => {
  it('accepts credits and debits with an optional note', () => {
    expect(accountAdjustSchema.safeParse({ type: 'credit', amount: 500 }).success).toBe(true);
    expect(
      accountAdjustSchema.parse({ type: 'debit', amount: '20', note: '  ATM  ' })
    ).toMatchObject({ amount: 20, note: 'ATM' });
  });

  it('drops blank notes and rejects zero amounts or unknown types', () => {
    expect(accountAdjustSchema.parse({ type: 'credit', amount: 1, note: '  ' }).note).toBeUndefined();
    expect(accountAdjustSchema.safeParse({ type: 'credit', amount: 0 }).success).toBe(false);
    expect(accountAdjustSchema.safeParse({ type: 'refund', amount: 5 }).success).toBe(false);
  });
});

describe('transferSchema', () => {
  it('accepts a transfer between two accounts', () => {
    expect(transferSchema.safeParse({ fromId: ID_A, toId: ID_B, amount: 100 }).success).toBe(true);
  });

  it('rejects a transfer to the same account', () => {
    expect(transferSchema.safeParse({ fromId: ID_A, toId: ID_A, amount: 100 }).success).toBe(false);
  });
});

describe('expenseSchema accountId', () => {
  const base = { description: 'Lunch', amount: 10, category: 'Food', date: '2026-01-01' };

  it('accepts a valid id, null, or nothing', () => {
    expect(expenseSchema.safeParse({ ...base, accountId: ID_A }).success).toBe(true);
    expect(expenseSchema.safeParse({ ...base, accountId: null }).success).toBe(true);
    expect(expenseSchema.safeParse(base).success).toBe(true);
  });

  it('rejects a malformed id', () => {
    expect(expenseSchema.safeParse({ ...base, accountId: 'nope' }).success).toBe(false);
  });
});
