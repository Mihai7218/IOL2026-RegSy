import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Claims, Role } from "./roles"
import { FunnelIcon } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFolder(role: Role) : string {
  switch (role) {
    case "country":
      return "countries"
    case "jury":
      return "juryMembers"
    case "volunteer":
      return "volunteers"
    case "loc":
      return "locMembers"
    default:
      throw Error("failed to get folder");
  }
}

export function formatDatetimeEEST(iso?: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    
    const eestDate = new Date(d.getTime() + 3 * 60 * 60 * 1000)
    
    const yyyy = eestDate.getUTCFullYear()
    const mm = pad(eestDate.getUTCMonth() + 1)
    const dd = pad(eestDate.getUTCDate())
    const hh = pad(eestDate.getUTCHours())
    const min = pad(eestDate.getUTCMinutes())
    
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`
  } catch {
    return iso
  }
}

export const getRole = (claims : Claims | undefined) => claims?.country ? "country" : claims?.juryMember ? "jury" : claims?.volunteer ? "volunteer" : claims?.locMember ? "loc" : "guest"

export function setEquality<T>(a: Set<T>, b: Set<T>): boolean {
  return a.size == b.size && [...a].every((x) => b.has(x))
}