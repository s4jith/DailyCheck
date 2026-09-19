export type BudgetHealth = 'healthy' | 'near' | 'over';

export interface BudgetStatus {
  health: BudgetHealth;
  /** Percent of the budget used, uncapped (can exceed 100). */
  share: number;
  /** Percent to draw in a progress bar, capped at 100. */
  progress: number;
  /** Positive when there is budget left, otherwise how far over it is. */
  remaining: number;
}

export function budgetStatus(spent: number, amount: number): BudgetStatus {
  const share = amount > 0 ? (spent / amount) * 100 : 0;

  return {
    health: share > 100 ? 'over' : share >= 80 ? 'near' : 'healthy',
    share,
    progress: Math.min(share, 100),
    remaining: amount - spent,
  };
}

/**
 * Bar colour by health. A budget that is merely being used stays neutral —
 * colour is spent on the two states that need attention.
 */
export const budgetBarClass: Record<BudgetHealth, string> = {
  healthy: 'bg-foreground/55',
  near: 'bg-warning',
  over: 'bg-destructive',
};

export const budgetTextClass: Record<BudgetHealth, string> = {
  healthy: 'text-muted-foreground',
  near: 'text-warning',
  over: 'text-destructive',
};
