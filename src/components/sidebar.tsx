"use client"
import { Home, User, Users, Plane, Banknote, LogOut, Phone, SquareChartGantt  } from "lucide-react"
import Image from "next/image";
// import { useUserStore } from "@/lib/stores"
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Skeleton } from "./ui/skeleton";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

enum status {
  TIME_SENSITIVE = "Time Sensitive",
  NOT_TIME_SENSITIVE = "Not Time Sensitive",
}
 
// Menu items.
const menuItems = [
      {
        icon: Home,
        status: status.TIME_SENSITIVE,
        label: "Main",
        href: "",
        visible: ["admin", "country", "volunteer", "jury"],
      },
      {
        icon: SquareChartGantt,
        status: status.TIME_SENSITIVE,
        label: "Admin",
        href: "admin",
        visible: ["admin"],
      },
      {
        icon: Phone,
        status: status.TIME_SENSITIVE,
        label: "Contacts",
        href: "contacts",
        visible: ["admin", "country"],
      },
      {
        icon: Banknote,
        status: status.TIME_SENSITIVE,
        label: "Payments",
        href: "payments",
        visible: ["admin", "country"],
      },

      {
        icon: Users,
        status: status.TIME_SENSITIVE,
        label: "Teams",
        href: "teams",
        visible: ["admin", "country"],
      },
      {
        icon: User,
        status: status.TIME_SENSITIVE,
        label: "Members",
        href: "members",
        visible: ["admin", "country"],
      },
      {
        icon: Plane,
        status: status.TIME_SENSITIVE,
        label: "Transportation",
        href: "transport",
        visible: ["admin", "country", "volunteer", "jury"],
      },
      
  ];
 
export function AppSidebar() {

  const { currentUser, isLoading } = { currentUser: { name: "John Doe", email: "john.doe@example.com", role: "admin" }, isLoading: false };
  const router = useRouter();


  return (
    <Sidebar >
        <SidebarHeader>
            <div className="flex items-center space-x-4 p-2">
            {isLoading ? (
                <div className="flex items-center space-x-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div>
                  <Skeleton className="w-24 h-4 mb-1" />
                  <Skeleton className="w-32 h-3" />
                </div>
                </div>
            ) : (
              <>
              <Image src="/images/logo/icon_small.png" alt="User Avatar" width={40} height={40} className="rounded-full" />
              <div>
                <p className="text-sm font-medium">{currentUser?.name}</p>
                <p className="text-xs text-gray-500">{currentUser?.email}</p>
              </div>
              </>
            )}
            </div>
        </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                item.visible.includes(currentUser?.role) && (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    {item.status === status.NOT_TIME_SENSITIVE && currentUser?.role != "admin" ? (
                      <div className="text-gray-300 cursor-not-allowed">
                      <item.icon size={16} className="text-gray-300" />
                      <span>{item.label}</span>
                      </div>
                    ) : (
                      <Link href={item.href}>
                      <item.icon size={16} />
                      <span>{item.label}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                )
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <Button
                    variant="ghost"
                    onClick={async () => {
                      
                      console.log("Logging out...");
                      await signOut(auth);
                      console.log("User signed out successfully.");
                      router.push("/");
                      }
                    }
                    className="ml-auto p-0"
                    >
                      <LogOut size={16} />
                      Logout
                    </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
