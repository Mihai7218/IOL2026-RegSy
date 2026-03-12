import { doc, getDoc } from "@firebase/firestore"
import { auth, db } from "./firebase"
import { Claims } from "./roles"
import { User } from "firebase/auth"

let claims : Claims | undefined = undefined

export async function getClaims(u : User | null) {
    if (!u) return undefined
    if (claims === undefined) await getClaimsEager(u)
    return claims
}

export function resetClaims() {
    claims = undefined
}

async function getClaimsEager(u : User) {
    let nextClaims: Claims = {}
    if (!u) throw new Error('Not authenticated')
    while (Object.keys(nextClaims).length === 0) {
        try {
        const adminDoc = await getDoc(doc(db, 'admins', u.uid))
        if (adminDoc.exists()) {
            nextClaims.admin = true
        }
        } catch (e) {
        console.error('AuthProvider: Failed to check admin status', e)
        }

        try {
        const countryDoc = await getDoc(doc(db, 'countries', u.uid))
        if (countryDoc.exists()) {
            const countryData = countryDoc.data()
            nextClaims.country = true
            nextClaims.countryKey = countryData.country_code
        }
        } catch (e) {
        console.error('AuthProvider: Failed to check country status', e)
        }

        try {
        const juryDoc = await getDoc(doc(db, 'juryMembers', u.uid))
        if (juryDoc.exists()) {
            nextClaims.juryMember = true
        }
        } catch (e) {
        console.error('AuthProvider: Failed to check jury member status', e)
        }

        try {
        const volunteerDoc = await getDoc(doc(db, 'volunteers', u.uid))
        if (volunteerDoc.exists()) {
            nextClaims.volunteer = true
        }
        } catch (e) {
        console.error('AuthProvider: Failed to check volunteer status', e)
        }

        try {
        const locDoc = await getDoc(doc(db, 'locMember', u.uid))
        if (locDoc.exists()) {
            nextClaims.locMember = true
        }
        } catch (e) {
        console.error('AuthProvider: Failed to check LOC member status', e)
        }
        claims = nextClaims
    }
}