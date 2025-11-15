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
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { auth, provider, db, functions } from "@/lib/firebase";

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
  countryName: string;
  countryKey: string;
};

type InviteResponse = {
  countryName: string;
  countryKey: string;
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

  // Callable Functions / invitation errors: "functions/..."
  if (anyErr.code.startsWith("functions/")) {
    switch (anyErr.code) {
      case "functions/not-found":
        return {
          code: "InvalidInvitation",
          message: "Invitation code is invalid.",
        };
      case "functions/already-exists":
        return {
          code: "InvitationAlreadyUsed",
          message: "Invitation code was already used.",
        };
      case "functions/failed-precondition":
        return {
          code: "InvitationExpired",
          message: "Invitation code has expired.",
        };
      default:
        return { code: "Unknown", message };
    }
  }

  return { code: "Unknown", message };
}

async function ensureUserDocument(
  user: User,
  extra?: { name?: string; role?: string }
): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  const existing = snap.exists() ? (snap.data() as any) : {};
  const name = extra?.name ?? user.displayName ?? existing.name ?? "";
  const role = extra?.role ?? existing.role ?? "country";

  const payload = {
    name,
    email: user.email ?? null,
    role,
    updatedAt: serverTimestamp(),
    ...(snap.exists()
      ? {}
      : {
          createdAt: serverTimestamp(),
        }),
  };

  await setDoc(ref, payload, { merge: true });

  if (!user.displayName && name) {
    await updateProfile(user, { displayName: name });
  }
}

async function redeemInvitation(code: string): Promise<CountryInfo> {
  const trimmed = code.trim();
  if (!trimmed) {
    throw new Error("Invitation code is required");
  }

  const callable = httpsCallable(functions, "redeemInvite");
  const res = await callable({ code: trimmed });
  const data = res.data as InviteResponse;

  return {
    countryName: data.countryName,
    countryKey: data.countryKey,
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

    await ensureUserDocument(user);

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

    await ensureUserDocument(user);

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
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;

    const country = await redeemInvitation(invitationCode);

    await ensureUserDocument(user, {
      name: country.countryName,
      role: "country",
    });

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
    const cred = await signInWithPopup(auth, provider as GoogleAuthProvider);
    user = cred.user;

    const country = await redeemInvitation(invitationCode);

    await ensureUserDocument(user, {
      name: country.countryName,
      role: "country",
    });

    return { ok: true, data: { user, country } };
  } catch (error) {
    if (user) {
      try {
        await deleteUser(user);
      } catch {
        // ignore
      }
    }
    const mapped = mapAuthError(error);
    return fail(mapped.code, mapped.message);
  }
}
