import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { requireAuth } from "@/lib/auth-utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import db from "@/lib/db";
import { UserRole } from "@prisma/client";
import type { PropsWithChildren } from "react";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  await requireAuth();
  
  // Get user role
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  
  let userRole: UserRole = "DISPONENT";
  
  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (user) {
      userRole = user.role;
    }
  }
  
  return (
    <SidebarProvider>
      <AppSidebar userRole={userRole} />
      <main className="flex-1 w-full overflow-auto pl-0 md:pl-[var(--sidebar-width)] transition-padding">
        {children}
      </main>
    </SidebarProvider>
  );
}
