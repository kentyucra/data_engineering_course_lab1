import {
  BarChart3,
  Boxes,
  Building2,
  Car,
  ClipboardList,
  Database,
  Home,
  Users
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/employees", label: "Employees", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/schema", label: "Schema", icon: Database }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Classic Models</p>
            <p className="text-xs text-muted-foreground">Operations</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 lg:block">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-max items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
