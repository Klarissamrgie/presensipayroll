"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileEdit,
  GraduationCap,
  DollarSign,
  UserCircle,
  ClipboardList,
  BookOpen,
} from "lucide-react";

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const roleMenus: Record<string, MenuItem[]> = {
  admin: [
    {
      title: "Kelola User",
      href: "/protected/admin/kelola-teacher",
      icon: Users,
    },
    {
      title: "Kelola Grade",
      href: "/protected/admin/kelola-grade",
      icon: GraduationCap,
    },
    {
      title: "Kelola Jadwal",
      href: "/protected/admin/kelola-jadwal",
      icon: Calendar,
    },
    {
      title: "Pengajuan Edit",
      href: "/protected/admin/pengajuan-edit",
      icon: FileEdit,
    },
  ],
  finance: [
    {
      title: "Kelola Payroll",
      href: "/protected/finance/kelola-payroll",
      icon: DollarSign,
    },
  ],
  teacher: [
    {
      title: "Dashboard",
      href: "/protected/teacher/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Absensi",
      href: "/protected/teacher/absensi",
      icon: ClipboardList,
    },
    {
      title: "Student",
      href: "/protected/teacher/student",
      icon: BookOpen,
    },
    {
      title: "Pengajuan Edit",
      href: "/protected/teacher/pengajuan-edit",
      icon: FileEdit,
    },
    {
      title: "Account",
      href: "/protected/teacher/account",
      icon: UserCircle,
    },
  ],
};

interface SidebarProps {
  userEmail?: string | null;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  
  // Determine role from pathname
  let role: string | null = null;
  if (pathname.startsWith("/protected/admin")) {
    role = "admin";
  } else if (pathname.startsWith("/protected/finance")) {
    role = "finance";
  } else if (pathname.startsWith("/protected/teacher")) {
    role = "teacher";
  }

  // If no role detected, don't show sidebar
  if (!role || !roleMenus[role]) {
    return null;
  }

  const menuItems = roleMenus[role];
  const basePath = `/protected/${role}`;

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-background p-4 flex flex-col">
      <div className="mb-8">
        <Link href={basePath} className="flex items-center gap-2">
          <h2 className="text-xl font-bold capitalize">{role} Dashboard</h2>
        </Link>
      </div>
      <nav className="space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      {userEmail && (
        <div className="mt-auto pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground px-3 py-2 truncate">
            {userEmail}
          </p>
        </div>
      )}
    </aside>
  );
}

