"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  FileText,
  Sparkles,
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Triage Feed",
    href: "/dashboard/feed",
    icon: Mail,
  },
  {
    label: "Investor Update",
    href: "/dashboard/investor-update",
    icon: FileText,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border/50 bg-sidebar/80 backdrop-blur-xl transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border/50">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(0.75_0.15_270)] to-[oklch(0.65_0.2_290)] flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden animate-in-scale">
              <h1 className="text-sm font-bold tracking-tight gradient-text">
                AI Co-Founder
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Chief of Staff
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary font-medium glow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Demo Mode Badge */}
        {!collapsed && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50 border border-border/50">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <div>
                <p className="text-[10px] font-medium text-foreground">Demo Mode</p>
                <p className="text-[9px] text-muted-foreground">Using seeded data</p>
              </div>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-3 border-t border-border/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
