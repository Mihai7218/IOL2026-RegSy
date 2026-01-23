export type Claims = {
  admin?: boolean
  country?: boolean
  juryMember?: boolean
  volunteer?: boolean
  locMember?: boolean
  countryKey?: string
}

export const isAdmin = (claims?: Claims) => claims?.admin === true
export const isCountry = (claims?: Claims) => claims?.country === true
export const isJuryMember = (claims?: Claims) => claims?.juryMember === true
export const isVolunteer = (claims?: Claims) => claims?.volunteer === true
export const isLocMember = (claims?: Claims) => claims?.locMember === true

export type Role = "admin" | "country" | "jury" | "volunteer" | "loc" | "guest"
