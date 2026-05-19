export type Claims = {
  admin?: boolean
  country?: boolean
  juryMember?: boolean
  countryKey?: string
}

export const isAdmin = (claims?: Claims) => claims?.admin === true
export const isCountry = (claims?: Claims) => claims?.country === true
export const isJuryMember = (claims?: Claims) => claims?.juryMember === true

export type Role = "admin" | "country" | "jury" | "guest"
