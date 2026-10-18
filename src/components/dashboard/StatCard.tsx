import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type Tone = 'default' | 'success' | 'warning';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  description?: string;
  /** Colours the icon tile and the figure. `default` is the brand red. */
  tone?: Tone;
  /** Draws a hairline accent along the card's top edge. */
  featured?: boolean;
  className?: string;
}

const toneStyles: Record<Tone, { tile: string; value: string; rule: string }> = {
  default: {
    tile: 'border-primary/22 bg-primary/10 text-primary',
    value: 'text-foreground',
    rule: 'from-primary/70',
  },
  success: {
    tile: 'border-success/25 bg-success/10 text-success',
    value: 'text-success',
    rule: 'from-success/70',
  },
  warning: {
    tile: 'border-warning/25 bg-warning/10 text-warning',
    value: 'text-warning',
    rule: 'from-warning/70',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  tone = 'default',
  featured = false,
  className,
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <Card className={cn('relative overflow-hidden p-5 sm:p-6', className)}>
      {featured && (
        <span
          aria-hidden
          className={cn(
            'absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent',
            styles.rule
          )}
        />
      )}
      <div className="flex items-center gap-3">
        <span className={cn('icon-tile', styles.tile)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      </div>
      <p
        className={cn(
          'tabular mt-4 font-headline text-[1.75rem] font-bold leading-none tracking-tight [overflow-wrap:anywhere] sm:text-[2rem] md:text-2xl 2xl:text-[2rem]',
          styles.value
        )}
      >
        {value}
      </p>
      {description && <p className="mt-2 text-xs text-muted-foreground">{description}</p>}
    </Card>
  );
}
