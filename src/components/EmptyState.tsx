import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Usually the same dialog trigger the page header uses. */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-white/12 bg-white/2 px-6 py-16 text-center',
        className
      )}
    >
      <div className="icon-tile mb-4 h-12 w-12 rounded-xl [&>svg]:h-5 [&>svg]:w-5">
        <Icon />
      </div>
      <h3 className="font-headline text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
