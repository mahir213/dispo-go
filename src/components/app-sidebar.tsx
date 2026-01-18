"use client";

import {
    TruckIcon,
    LogOutIcon,
    SettingsIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

const menuItems = [
    {
        title: "Vozila",
        items: [
            {
                title: "Vozila",
                icon: TruckIcon,
                url: "/vozila",
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

    return(
        <Sidebar collapsible="icon">
            <SidebarHeader>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild className="gap-x-4 h-10 px-4">
                        <Link href="/" prefetch>
                            <TruckIcon className="size-8"/>
                            <span className="font-semibold text-sm">Dispo-Go</span>
                        </Link> 
                    </SidebarMenuButton>
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
                                <span>Odjava</span>
                            <LogOutIcon className="h-4 w-4"/>
                            
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
    
};
