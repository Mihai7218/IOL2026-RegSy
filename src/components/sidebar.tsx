"use client"
import { Home, User, Users, Plane, Banknote, LogOut, Phone, SquareChartGantt  } from "lucide-react"
import Image from "next/image";
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
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { doc, DocumentReference, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthProvider";
import { isAdmin, isCountry, isJuryMember } from "@/lib/roles";

enum status {
  TIME_SENSITIVE = "Time Sensitive",
  NOT_TIME_SENSITIVE = "Not Time Sensitive",
}
 
type SidebarUser = {
  name: string
  email: string
  role: string
}
 
// Menu items.
const menuItems = [
      {
        icon: Home,
        status: status.TIME_SENSITIVE,
        label: "Main",
        href: "/",
        visible: ["admin", "country", "volunteer", "jury"],
      },
      {
        icon: SquareChartGantt,
        status: status.TIME_SENSITIVE,
        label: "Admin",
        href: "/admin",
        visible: ["admin"],
      },
      {
        icon: Phone,
        status: status.TIME_SENSITIVE,
        label: "Contacts",
        href: "/contacts",
        visible: ["admin", "country", "jury"],
      },
      {
        icon: Banknote,
        status: status.TIME_SENSITIVE,
        label: "Payment (Country)",
        href: "/payments",
        visible: ["admin"],
      },
      {
        icon: Banknote,
        status: status.TIME_SENSITIVE,
        label: "Payment",
        href: "/payments",
        visible: ["country"],
      },
      {
        icon: Banknote,
        status: status.TIME_SENSITIVE,
        label: "Payment (Jury)",
        href: "/juryPayments",
        visible: ["admin"],
      },
      {
        icon: Banknote,
        status: status.TIME_SENSITIVE,
        label: "Payment",
        href: "/juryPayments",
        visible: ["jury"],
      },

      {
        icon: Users,
        status: status.TIME_SENSITIVE,
        label: "Teams",
        href: "/teams",
        visible: ["admin", "country"],
      },
      {
        icon: User,
        status: status.TIME_SENSITIVE,
        label: "Members",
        href: "/members",
        visible: ["admin", "country", "jury"],
      },
      {
        icon: Plane,
        status: status.TIME_SENSITIVE,
        label: "Transportation",
        href: "/transport",
        visible: ["admin", "country", "jury"],
      },
      
  ];
 
export function AppSidebar() {
  const { user, claims, loading: authLoading } = useAuth()
  const [currentUser, setCurrentUser] = useState<SidebarUser | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const router = useRouter();

  const fallbackName = useMemo(() => user?.displayName || user?.email || "User", [user?.displayName, user?.email])
  const email = user?.email || ""
  const userUid = user?.uid ?? null
  const role = useMemo(() => (isAdmin(claims) ? "admin" : isCountry(claims) ? "country" : isJuryMember(claims) ? "jury" : "guest"), [claims, userUid])

  function getName(data : any) : string {
    switch (role) {
      case "country": return typeof data?.country_name === "string" ? data.country_name : fallbackName
      case "jury": return typeof data?.jury_member_name === "string" ? data.jury_member_name : fallbackName
      default: return fallbackName
    }
  }

  function getData(ref : DocumentReference) {
    return onSnapshot(
        ref,
        (snap) => {
          const data = snap.data() as any
          const name = getName(data)
          setCurrentUser({ name, email, role })
          setProfileLoading(false)
        },
        (error) => {
          console.error("Failed to load country profile for sidebar", error)
          setCurrentUser({ name: fallbackName, email, role })
          setProfileLoading(false)
        },
      )
    }

  useEffect(() => {
    if (!userUid) {
      setCurrentUser(null)
      setProfileLoading(false)
      return
    }

    if (role === "admin") {
      setCurrentUser({ name: fallbackName, email, role: "admin" })
      setProfileLoading(false)
      return
    }

    if (role === "jury") {
      setProfileLoading(true)
      const juryRef = doc(db, "juryMembers", userUid)
      const unsub = getData(juryRef)

      return () => {
        setProfileLoading(false)
        unsub()
      }
    }

    if (role === "country") {
      setProfileLoading(true)
      const countryRef = doc(db, "countries", userUid)
      const unsub = getData(countryRef)

      return () => {
        setProfileLoading(false)
        unsub()
      }
    }
  }, [userUid, role, fallbackName, email])

  const isLoading = authLoading || profileLoading


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
              <Image src="/images/logo/logo.png" alt="User Avatar" width={40} height={40} className="" />
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
                currentUser && item.visible.includes(currentUser.role) && (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild>
                    {item.status === status.NOT_TIME_SENSITIVE && currentUser?.role != "admin" ? (
                      <div className="text-gray-300 cursor-not-allowed">
                      <item.icon size={16} className="text-gray-300" />
                      <span>{item.label}</span>
                      </div>
                    ) : (
                      <Link href={item.href as any}>
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
