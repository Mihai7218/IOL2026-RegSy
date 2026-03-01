import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Claims, Role } from "./roles"

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

export const getRole = (claims : Claims | undefined) => claims?.country ? "country" : claims?.juryMember ? "jury" : claims?.volunteer ? "volunteer" : claims?.locMember ? "loc" : "guest"