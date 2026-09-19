'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import {
  AreaChart,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  LogOut,
  PiggyBank,
  ReceiptText,
  Shapes,
  Target,
  User as UserIcon,
  Wallet,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarHeader,
  SidebarTrigger,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNavbar } from '@/components/BottomNavbar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/expenses', label: 'Expenses', icon: ReceiptText },
  { href: '/budgets', label: 'Budgets', icon: Target },
  { href: '/savings', label: 'Savings', icon: PiggyBank },
  { href: '/reports', label: 'Reports', icon: AreaChart },
  { href: '/categories', label: 'Categories', icon: Shapes },
];

/** The wordmark, used in the sidebar, the mobile header and the sign-in screen. */
function Brand({ className, size = 'sm' }: { className?: string; size?: 'sm' | 'lg' }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-[10px] border border-primary/25 bg-primary/12 text-primary',
          size === 'lg' ? 'h-12 w-12 rounded-xl' : 'h-8 w-8'
        )}
      >
        <Wallet className={size === 'lg' ? 'h-6 w-6' : 'h-[18px] w-[18px]'} />
      </span>
      <span
        className={cn(
          'font-headline font-bold tracking-tight',
          size === 'lg' ? 'text-2xl' : 'text-lg'
        )}
      >
        Finance<span className="text-primary">Flow</span>
      </span>
    </div>
  );
}

function UserNav() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <Skeleton className="h-9 w-9 rounded-full" />;
  }

  if (!session?.user) {
    return (
      <Button onClick={() => signIn('google')}>
        <LogIn className="mr-2 h-4 w-4" />
        Login with Google
      </Button>
    );
  }

  const user = session.user;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'relative h-9 w-9 shrink-0 rounded-full p-0 hover:bg-white/8',
            'group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10'
          )}
        >
          <Avatar className="h-9 w-9 border border-white/10">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
            <AvatarFallback className="bg-primary/12 text-sm font-semibold text-primary">
              {user.name?.charAt(0) ?? 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="truncate text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SignInScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="surface-edge w-full max-w-sm rounded-lg border border-white/8 bg-card p-8 text-center">
        <Brand size="lg" className="justify-center" />
        <h1 className="mt-6 font-headline text-xl font-bold tracking-tight">
          Track every rupee.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Budgets, expenses and savings goals in one place. Sign in to pick up where you left
          off.
        </p>
        <div className="mt-7">
          <UserNav />
        </div>
      </div>
    </div>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isMobile = useIsMobile();

  if (status === 'loading') {
    return (
      <div className="flex h-svh w-full items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return <SignInScreen />;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-3 py-4">
          <Brand className="group-data-[collapsible=icon]:justify-center [&>span:last-child]:group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>
        <p className="px-5 pb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
          Menu
        </p>
        <SidebarMenu className="flex-1 gap-1 px-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                  <div>
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <UserNav />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-white/6 bg-background/80 px-4 backdrop-blur-md sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4 sm:backdrop-blur-none">
          <div className="md:hidden">
            <Brand />
          </div>
          <div className="hidden md:block">
            <SidebarTrigger />
          </div>
          <div className="md:hidden">
            <UserNav />
          </div>
        </header>
        <main className="p-4 pb-24 sm:px-6 sm:pb-10 sm:pt-0 md:pb-10">{children}</main>
        {isMobile && <BottomNavbar navItems={navItems} />}
      </SidebarInset>
    </SidebarProvider>
  );
}
