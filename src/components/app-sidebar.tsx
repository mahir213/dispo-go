"use client";

import {
    TruckIcon,
    LogOutIcon,
    SettingsIcon,
    BellIcon,
    UserIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NotificationsModal } from "@/components/notifications-modal";
import { Badge } from "@/components/ui/badge";

const menuItems = [
    {
        title: "Vozila",
        items: [
            {
                title: "Vozila",
                icon: TruckIcon,
                url: "/vozila",
            },
            {
                title: "Vozači",
                icon: UserIcon,
                url: "/vozaci",
            },
        ],
    },
    {
        title: "Postavke",
        items: [
            {
                title: "Postavke",
                icon: SettingsIcon,
                url: "/postavke",
            },
        ],
    },
];

export const AppSidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [hasExpired, setHasExpired] = useState(false);

    useEffect(() => {
        fetchNotificationCount();
        // Refresh every 5 minutes
        const interval = setInterval(fetchNotificationCount, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotificationCount = async () => {
        try {
            const response = await fetch("/api/vehicles/notifications");
            if (response.ok) {
                const data = await response.json();
                setNotificationCount(data.count);
                setHasExpired(data.hasExpired);
            }
        } catch (error) {
            console.error("Error fetching notification count:", error);
        }
    };

    return(
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenuItem>
                    <Link href="/" prefetch className="flex items-center gap-x-4 h-10 px-4">
                        <Image src="/dispo-logo.svg" alt="Dispo-Go Logo" width={32} height={32} className="size-8" />
                        <span className="font-bold text-base tracking-tight">Dispo-Go</span>
                    </Link> 
                </SidebarMenuItem>
            </SidebarHeader>
            <SidebarContent>
                {menuItems.map((group)=>(
                    <SidebarGroup key={group.title}>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item)=>(
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                        tooltip={item.title}
                                        isActive={
                                            item.url === "/"
                                            ? pathname === "/"
                                            : pathname.startsWith(item.url)
                                        }
                                        asChild 
                                        className="gap-x-4 h-10 px-4"
                                        >
                                            <Link href={item.url} prefetch>
                                            <item.icon className="size-4"/>
                                            <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton 
                        tooltip="Notifikacije"
                        className="gap-x-4 h-10 px-4"
                        onClick={() => setNotificationsOpen(true)}
                        >
                            <div className="relative">
                                <BellIcon className="h-4 w-4"/>
                                {notificationCount > 0 && (
                                    <Badge 
                                        className={`absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center ${
                                            hasExpired ? "bg-destructive" : "bg-orange-500"
                                        }`}
                                    >
                                        {notificationCount > 9 ? "9+" : notificationCount}
                                    </Badge>
                                )}
                            </div>
                            <span>Notifikacije</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton 
                        tooltip="Odjava"
                        className="gap-x-4 h-10 px-4"
                        onClick={()=>authClient.signOut({
                            fetchOptions:{
                                onSuccess: ()=> {
                                    router.push("/login");
                                }
                            },
                        })}
                        >
                            <LogOutIcon className="h-4 w-4"/>
                            <span>Odjava</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <NotificationsModal 
                open={notificationsOpen} 
                onOpenChange={setNotificationsOpen}
            />
        </Sidebar>
    )
    
};
