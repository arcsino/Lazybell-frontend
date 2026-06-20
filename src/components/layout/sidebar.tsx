"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  Home,
  LogOut,
  Settings,
  Users,
  X,
  ChevronRight,
  Mail,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: Home },
  { href: "/calendar", label: "カレンダー", icon: Calendar },
  { href: "/groups", label: "グループ", icon: Users },
  { href: "/invites", label: "招待", icon: Mail },
  { href: "/help", label: "ヘルプ", icon: HelpCircle },
  { href: "/profile", label: "プロフィール", icon: Settings },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-800">
        <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
            <Bell className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">Lazybell</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:text-white transition-colors lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    active
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      active
                        ? "text-brand-400"
                        : "text-zinc-500 group-hover:text-zinc-300",
                    )}
                  />
                  {label}
                  {active && (
                    <ChevronRight className="ml-auto h-3 w-3 text-zinc-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-800 p-4">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs">
              {user ? getInitials(user.nickname) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user?.nickname}
            </p>
            <p className="truncate text-xs text-zinc-500">@{user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            title="ログアウト"
            className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
