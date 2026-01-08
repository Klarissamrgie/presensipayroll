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
  User,
  School,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MenuItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const roleMenus: Record<string, MenuItem[]> = {
  admin: [
    {
      title: "Kelola Teacher",
      href: "/protected/admin/kelola-teacher",
      icon: Users,
    },
    {
      title: "Kelola Student",
      href: "/protected/admin/kelola-student",
      icon: User,
    },
    {
      title: "Kelola Grade",
      href: "/protected/admin/kelola-grade",
      icon: GraduationCap,
    },
    {
      title: "Kelola Kelas",
      href: "/protected/admin/kelola-kelas",
      icon: School,
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
      href: "/protected/finance",
      icon: DollarSign,
    },
  ],
  teacher: [
    {
      title: "Dashboard",
      href: "/protected/teacher",
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
    <aside className="w-64 min-h-screen border-r border-border bg-card flex flex-col">
      <div className="p-6">
        <Link href={basePath} className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight capitalize">{role} Panel</span>
        </Link>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <nav className="flex flex-col gap-1 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            // 1. Check if the current path matches this item's href
            const isMatch = pathname === item.href || pathname.startsWith(item.href + "/");

            // 2. FIX: Check if there is a "more specific" (longer href) menu item that ALSO matches.
            // If so, that item takes precedence, and this one should NOT be active.
            // This prevents "Dashboard" (/protected/teacher) from being active when "Absensi" (/protected/teacher/absensi) is active.
            const isOverridden = menuItems.some(otherItem => 
               otherItem !== item && 
               (pathname === otherItem.href || pathname.startsWith(otherItem.href + "/")) &&
               otherItem.href.length > item.href.length
            );
            
            const isActive = isMatch && !isOverridden;
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-10 mb-1 font-normal",
                  isActive 
                    ? "bg-secondary text-secondary-foreground shadow-sm font-medium" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                asChild
              >
                <Link href={item.href}>
                  <Icon className={cn("h-4 w-4", isActive ? "text-foreground" : "text-muted-foreground")} />
                  {item.title}
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 mt-auto">
        <Separator className="mb-4 bg-border/50" />
        {userEmail ? (
          <div className="flex items-center gap-3 px-1 group cursor-default">
            <Avatar className="h-9 w-9 border border-border transition-all group-hover:border-primary/50">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}`} alt={userEmail} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                {userEmail.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate leading-none text-foreground">
                {userEmail.split('@')[0]}
              </span>
              <span className="text-xs text-muted-foreground truncate mt-1">
                {userEmail}
              </span>
            </div>
          </div>
        ) : (
          <div className="px-1 py-2 text-xs text-muted-foreground text-center bg-muted/30 rounded-md">
            Guest User
          </div>
        )}
      </div>
    </aside>
  );
}