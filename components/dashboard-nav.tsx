"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Settings,
  User,
  Home,
} from "lucide-react";

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role || 0;

  // Navigation items based on user role
  const navItems = [
    {
      title: "Home",
      href: "/",
      icon: Home,
      roles: [1, 2, 3], // All roles can access home
    },
    {
      title: "Dashboard",
      href:
        role === 1
          ? "/dashboard/admin"
          : role === 2
          ? "/dashboard/sub-admin"
          : "/dashboard/consumer",
      icon: LayoutDashboard,
      roles: [1, 2, 3], // All roles can access their respective dashboards
    },
    {
      title: "Profile",
      href: "/dashboard/profile",
      icon: User,
      roles: [1, 2, 3], // All roles can access profile
    },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <nav className="grid items-start gap-2 py-4">
      {filteredNavItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? "secondary" : "ghost"}
          className={cn(
            "justify-start",
            pathname === item.href && "bg-muted font-medium"
          )}
          asChild
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.title}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
