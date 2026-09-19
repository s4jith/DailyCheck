'use client';

import { formatInr } from '@/lib/utils';

interface TooltipPayloadItem {
  value?: number | string;
  name?: string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  /** Overrides the bold line under the label, e.g. "3 transactions". */
  footer?: (label: string) => string | null;
}

/**
 * Shared tooltip surface for every chart, so hover looks identical across the
 * app. Values stay in ink; the swatch carries the series identity.
 */
export function ChartTooltip({ active, payload, label, footer }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const note = footer?.(String(label ?? ''));

  return (
    <div className="rounded-lg border border-white/12 bg-popover/95 px-3 py-2 shadow-[0_12px_32px_-8px_hsl(0_0%_0%/0.8)] backdrop-blur-md">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((item, index) => (
        <p key={index} className="mt-1 flex items-center gap-2 text-sm font-semibold">
          <span
            aria-hidden
            className="h-2 w-2 rounded-[2px]"
            style={{ backgroundColor: item.color }}
          />
          <span className="tabular text-foreground">{formatInr(Number(item.value ?? 0))}</span>
        </p>
      ))}
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
