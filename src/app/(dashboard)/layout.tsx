import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { requireAuth } from "@/lib/auth-utils";
import type { PropsWithChildren } from "react";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  await requireAuth();
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full overflow-auto pl-0 md:pl-[var(--sidebar-width)] transition-padding">
        {children}
      </main>
    </SidebarProvider>
  );
}
