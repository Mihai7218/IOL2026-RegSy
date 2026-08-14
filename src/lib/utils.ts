import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Claims, Role } from "./roles"
import { FunnelIcon } from "lucide-react"
import { utcOffset } from "./loc"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFolder(role: Role) : string {
  switch (role) {
    case "country":
      return "countries"
    case "jury":
      return "juryMembers"
    default:
      throw Error("failed to get folder");
  }
}

export function formatDatetimeLocal(iso?: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    
    const localDate = new Date(d.getTime() + utcOffset * 60 * 60 * 1000)
    
    const yyyy = localDate.getUTCFullYear()
    const mm = pad(localDate.getUTCMonth() + 1)
    const dd = pad(localDate.getUTCDate())
    const hh = pad(localDate.getUTCHours())
    const min = pad(localDate.getUTCMinutes())
    
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`
  } catch {
    return iso
  }
}

export const getRole = (claims : Claims | undefined) => claims?.country ? "country" : claims?.juryMember ? "jury" : "guest"

export function setEquality<T>(a: Set<T>, b: Set<T>): boolean {
  return a.size == b.size && [...a].every((x) => b.has(x))
}