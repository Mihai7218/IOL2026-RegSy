export type Claims = {
  admin?: boolean
  country?: boolean
  countryKey?: string
}

export const isAdmin = (claims?: Claims) => claims?.admin === true
export const isCountry = (claims?: Claims) => claims?.country === true
