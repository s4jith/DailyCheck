
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface BottomNavbarProps {
  navItems: NavItem[];
}

export function BottomNavbar({ navItems }: BottomNavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/8 bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden">
      <div
        className="grid h-16 items-center justify-items-center"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground',
                isActive && 'text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
