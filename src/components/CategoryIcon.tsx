import { icons, Shapes, type LucideIcon } from 'lucide-react';
import { categoryIcons } from '@/lib/types';

interface CategoryIconProps {
  category: string;
  className?: string;
}

/**
 * Renders the Lucide glyph mapped to a category, falling back to a generic one.
 * A component rather than a lookup helper so the icon is never *created*
 * during render.
 */
export function CategoryIcon({ category, className }: CategoryIconProps) {
  const iconName = categoryIcons[category] ?? categoryIcons.Default;
  const Glyph: LucideIcon = (icons as Record<string, LucideIcon>)[iconName] ?? Shapes;

  return <Glyph className={className} />;
}
