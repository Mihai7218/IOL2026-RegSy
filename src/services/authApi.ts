// src/features/auth/api/authApi.ts
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
  User,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";

import { auth, provider, db } from "@/lib/firebase";

export type AuthErrorCode =
  | "InvalidInvitation"
  | "InvitationAlreadyUsed"
  | "InvitationExpired"
  | "AuthUserNotFound"
  | "AuthWrongPassword"
  | "AuthEmailInUse"
  | "AuthWeakPassword"
  | "NetworkError"
  | "Unknown";

export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: AuthErrorCode; message: string };

export type CountryInfo = {
  country_code: string;
  country_name: string;
};

function fail<T>(code: AuthErrorCode, message: string): AuthResult<T> {
  return { ok: false, code, message };
}

function mapAuthError(error: unknown): { code: AuthErrorCode; message: string } {
  if (!error || typeof error !== "object") {
    return { code: "Unknown", message: "Unexpected error" };
  }

  const anyErr = error as { code?: string; message?: string };
  const message = anyErr.message || "Unexpected error";

  if (!anyErr.code) {
    return { code: "Unknown", message };
  }

  // Firebase Auth errors: "auth/..."
  if (anyErr.code.startsWith("auth/")) {
    switch (anyErr.code) {
      case "auth/user-not-found":
        return { code: "AuthUserNotFound", message: "User not found." };
      case "auth/wrong-password":
        return { code: "AuthWrongPassword", message: "Incorrect password." };
      case "auth/email-already-in-use":
        return { code: "AuthEmailInUse", message: "Email already in use." };
      case "auth/weak-password":
        return { code: "AuthWeakPassword", message: "Weak password." };
      case "auth/network-request-failed":
        return {
          code: "NetworkError",
          message: "Network error. Please try again.",
        };
      default:
        return { code: "Unknown", message };
    }
  }

  return { code: "Unknown", message };
}

async function redeemInvitation(code: string): Promise<{ codeId: string; country: CountryInfo }> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    throw new Error("Invitation code is required");
  }

  const codeRef = doc(db, "invitationCodes", trimmed);
  const snap = await getDoc(codeRef);
  if (!snap.exists()) {
    throw new Error("Invalid invitation code.");
  }

  const data = snap.data() as any;
  if (data.used) {
    throw new Error("Invitation code already used.");
  }

  return {
    codeId: trimmed,
    country: {
      country_code: data.country_code as string,
      country_name: data.country_name as string,
    },
  };
}

// PUBLIC API

export async function loginWithEmail(
  email: string,
  password: string
): Promise<AuthResult<User>> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    return { ok: true, data: user };
  } catch (error) {
    const mapped = mapAuthError(error);
    return fail(mapped.code, mapped.message);
  }
}

export async function loginWithGoogle(): Promise<AuthResult<User>> {
  try {
    const cred = await signInWithPopup(auth, provider as GoogleAuthProvider);
    const user = cred.user;

    return { ok: true, data: user };
  } catch (error) {
    const mapped = mapAuthError(error);
    return fail(mapped.code, mapped.message);
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  invitationCode: string
): Promise<AuthResult<{ user: User; country: CountryInfo }>> {
  let user: User | null = null;

  try {
    // 1. Validate invitation code first (without marking it used yet)
    const { codeId, country } = await redeemInvitation(invitationCode);

    // 2. Create Auth user
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
    const authUid = user.uid;

    const codeRef = doc(db, "invitationCodes", codeId);
    const countryRef = doc(db, "countries", authUid);

    // 3. Atomically mark code as used + create country document
    await runTransaction(db, async (tx) => {
      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists()) {
        throw new Error("Invalid invitation code.");
      }
      const codeData = codeSnap.data() as any;
      if (codeData.used && codeData.usedBy !== authUid) {
        throw new Error("Invitation code already used.");
      }

      tx.set(
        codeRef,
        {
          used: true,
          used_by: authUid,
          used_at: serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        countryRef,
        {
          country_code: country.country_code,
          country_name: country.country_name,
          status: "registered",
          teamCount: 0,
          memberCount: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );
    });

    if (!user.displayName && country.country_name) {
      await updateProfile(user, { displayName: country.country_name });
    }

    return { ok: true, data: { user, country } };
  } catch (error) {
    if (user) {
      try {
        await deleteUser(user);
      } catch {
        // ignore cleanup failures
      }
    }
    const mapped = mapAuthError(error);
    return fail(mapped.code, mapped.message);
  }
}

export async function registerWithGoogle(
  invitationCode: string
): Promise<AuthResult<{ user: User; country: CountryInfo }>> {
  let user: User | null = null;

  try {
    // 1. Validate invitation code
    const { codeId, country } = await redeemInvitation(invitationCode);

    // 2. Sign in with Google (creates account if needed)
    const cred = await signInWithPopup(auth, provider as GoogleAuthProvider);
    user = cred.user;
    const authUid = user.uid;

    const codeRef = doc(db, "invitationCodes", codeId);
    const countryRef = doc(db, "countries", authUid);

    // 3. Same transaction as email flow
    await runTransaction(db, async (tx) => {
      const codeSnap = await tx.get(codeRef);
      if (!codeSnap.exists()) {
        throw new Error("Invalid invitation code.");
      }
      const codeData = codeSnap.data() as any;
      if (codeData.used && codeData.usedBy !== authUid) {
        throw new Error("Invitation code already used.");
      }

      tx.set(
        codeRef,
        {
          used: true,
          used_by: authUid,
          used_at: serverTimestamp(),
        },
        { merge: true }
      );

      tx.set(
        countryRef,
        {
          country_code: country.country_code,
          country_name: country.country_name,
          status: "registered",
          teamCount: 0,
          memberCount: 0,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );
    });

    if (!user.displayName && country.country_name) {
      await updateProfile(user, { displayName: country.country_name });
    }

    return { ok: true, data: { user, country } };
  } catch (error) {
    // For Google sign-in we don't attempt cleanup; user may already exist
    const mapped = mapAuthError(error);
    return fail(mapped.code, mapped.message);
  }
}
