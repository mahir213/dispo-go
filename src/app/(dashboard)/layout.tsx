import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { requireAuth } from "@/lib/auth-utils";
import { UserRole } from "@prisma/client";
import type { PropsWithChildren } from "react";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const session = await requireAuth();
  
  const userRole: UserRole = session.user.role as UserRole || "DISPONENT";
  
  return (
    <SidebarProvider>
      <AppSidebar userRole={userRole} />
      <main className="flex-1 w-full overflow-auto pl-0 md:pl-[var(--sidebar-width)] transition-padding">
        {children}
      </main>
    </SidebarProvider>
  );
}
