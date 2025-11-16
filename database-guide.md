````markdown
# Event Registration System with Firebase Auth + Firestore  
(authId-centric, admin behaves as a normal country account)

This document describes a Firebase design where:

- Each **account = one country**.
- The **Auth UID (`authId`) is the main key** to access that country’s data.
- An **admin user** behaves like a normal country account (same data structure, same flows) but also has extra permissions to see all countries.

No Cloud Functions are required; everything uses Firebase Auth + Firestore on the client.

---

## 1. High-Level Architecture

### 1.1 Entities

- **Auth user (Firebase Auth)**
  - Represents one country account (including admin account).
  - Identified by `uid` (authId).

- **Country data (Firestore)**
  - Stored in `/countries/{authUid}`.
  - Contains:
    - Country metadata (name, code, status, etc.).
    - Contact info
    - Transportation info
    - Payment info
    - Aggregated counts

- **Teams**
  - Subcollection `/countries/{authUid}/teams/{teamId}`.

- **Members**
  - Subcollection `/countries/{authUid}/members/{memberId}`.
  - Linked to teams via `teamId`.

- **Invitation codes**
  - Stored in `/invitationCodes/{code}`.
  - Map a code to the country’s metadata (e.g. name/code).
  - Track which Auth UID used the code.

- **Admin role**
  - Admin is a normal Auth user with their own `/countries/{authUid}` doc.
  - Extra privilege defined by a Firestore collection `/admins/{authUid}`.
  - Admin can:
    - Use their account as a normal country.
    - Open a dashboard to read/write any country.

---

## 2. Firestore Data Model

### 2.1 Countries (keyed by authId)

**Collection**

- `countries`

**Document path**

- `/countries/{authUid}`  
  `{authUid}` is exactly `request.auth.uid`.

**Example document**

```jsonc
// /countries/{authUid}
{
  "countryCode": "JP",                // ISO code or your own ID
  "countryName": "Japan",
  "status": "active",                 // e.g. "invited", "registered", "paid"

  // Contact info (1:1, small → embed)
  "contact": {
    "primaryName": "Taro Yamada",
    "primaryEmail": "taro@example.jp",
    "phone": "+81-90-xxxx-xxxx",
    "secondaryEmail": "delegation@example.jp"
  },

  // Transportation info (embed)
  "transport": {
    "arrivalDate": "2025-03-10",
    "arrivalFlight": "JL123",
    "departureDate": "2025-03-16",
    "departureFlight": "JL456",
    "airport": "NRT"
  },

  // Payment (embed)
  "payment": {
    "status": "paid",                 // "pending", "unpaid", "waived"
    "method": "bank-transfer",
    "invoiceNumber": "INV-2025-001",
    "paidAt": "2025-01-10T12:00:00Z"
  },

  // Aggregated info for quick display
  "teamCount": 2,
  "memberCount": 12
}
````

**Key point**
You always locate a country by its **authId**:

* Current user’s country document: `/countries/{currentUser.uid}`

---

### 2.2 Teams per country

**Path**

* `/countries/{authUid}/teams/{teamId}`

**Example document**

```jsonc
// /countries/{authUid}/teams/{teamId}
{
  "name": "Team A",
  "category": "Senior",              // division / category for the event
  "languageCodes": ["en", "ja"],     // languages used by this team
  "notes": "Prefers morning matches"
}
```

---

### 2.3 Members per country

**Path**

* `/countries/{authUid}/members/{memberId}`

**Example document**

```jsonc
// /countries/{authUid}/members/{memberId}
{
  "teamId": "teamA",                 // references /countries/{authUid}/teams/teamA

  "firstName": "Alice",
  "lastName": "Smith",
  "gender": "female",                // define your own enum / schema
  "diet": "vegetarian",
  "dateOfBirth": "2008-04-12",
  "passportNumber": "ABC123456",     // if needed
  "languageCodes": ["en"],

  // Optional denormalization for admin reports
  "countryCode": "JP",
  "countryName": "Japan",
  "teamName": "Team A"
}
```

**Why members are under `/countries/{authUid}` (not under `/teams`)**

* Easy to list all members for a country: query `/countries/{authUid}/members`.
* Still easy to list members by team: query where `teamId == "teamA"`.

---

## 3. Invitation Codes

### 3.1 Data model

**Collection**

* `invitationCodes`

**Document path**

* `/invitationCodes/{code}`
  `{code}` is the invitation string itself (e.g. `X9PQ4F2L`).

**Example document**

```jsonc
// /invitationCodes/{code}
{
  "countryCode": "JP",               // logical country ID
  "countryName": "Japan",

  "createdAt": "2025-01-01T00:00:00Z",
  "createdBy": "admin-authUid",

  // Usage tracking
  "used": false,
  "usedBy": null,                    // authUid
  "usedAt": null
}
```

* A code can represent:

  * Exactly one country.
  * One account.
* When a code is used:

  * `used` → `true`
  * `usedBy` → `authUid`
  * `usedAt` → timestamp
  * A country doc is created at `/countries/{authUid}`.

---

### 3.2 Generating codes (admin-side)

**Random code generator**

```ts
function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid O/0, I/1, etc.
  let result = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }
  return result;
}
```

**Create code document**

```ts
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

async function createInvitationCode(
  countryCode: string,
  countryName: string,
  adminUid: string
) {
  const code = generateCode();
  const ref = doc(db, "invitationCodes", code);

  await setDoc(ref, {
    countryCode,
    countryName,
    createdAt: serverTimestamp(),
    createdBy: adminUid,
    used: false,
    usedBy: null,
    usedAt: null,
  });

  return code;
}
```

Admins can generate these codes from an admin-only UI or manually in the console.

---

### 3.3 Validating code on registration form

Before creating the Auth account:

1. User enters “Invitation code” field.
2. Client reads `/invitationCodes/{code}`:

```ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

async function validateInvitationCode(code: string) {
  const ref = doc(db, "invitationCodes", code.trim().toUpperCase());
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    throw new Error("Invalid invitation code.");
  }

  const data = snap.data();
  if (data.used) {
    throw new Error("This code has already been used.");
  }

  // Show country name to the user:
  return {
    countryCode: data.countryCode as string,
    countryName: data.countryName as string,
  };
}
```

3. Display a message like:
   “You are registering as: Japan” to confirm.

---

## 4. Registration Flow (Email/Password & Google)

### 4.1 Email/password + invitation code

Steps:

1. User enters:

   * Email
   * Password
   * Invitation code
2. Validate code (as above).
3. Create Auth user.
4. Use a Firestore transaction to:

   * Mark the code as used.
   * Create the country document at `/countries/{authUid}`.

**Example**

```ts
import {
  runTransaction,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "./firebase";

async function registerWithEmailAndCode(
  email: string,
  password: string,
  code: string
) {
  // 1. Create Auth user
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  const authUid = user.uid;

  const codeId = code.trim().toUpperCase();
  const codeRef = doc(db, "invitationCodes", codeId);

  await runTransaction(db, async (tx) => {
    const codeSnap = await tx.get(codeRef);
    if (!codeSnap.exists()) throw new Error("Invalid invitation code.");

    const codeData = codeSnap.data();
    if (codeData.used && codeData.usedBy !== authUid) {
      throw new Error("Invitation code already used.");
    }

    const countryCode = codeData.countryCode;
    const countryName = codeData.countryName;

    const countryRef = doc(db, "countries", authUid);

    // Mark code as used
    tx.set(
      codeRef,
      {
        used: true,
        usedBy: authUid,
        usedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Create country document keyed by authUid
    tx.set(
      countryRef,
      {
        countryCode,
        countryName,
        status: "registered",
        teamCount: 0,
        memberCount: 0,
      },
      { merge: true }
    );
  });

  return authUid;
}
```

Result:

* The **only identifier you need to find the country document later is `authUid`**.
* Path: `/countries/{authUid}`.

---

### 4.2 Google sign-in + invitation code

Same logic, but use Google Auth instead of `createUserWithEmailAndPassword`.

```ts
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

async function registerWithGoogleAndCode(code: string) {
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  const authUid = user.uid;

  const codeId = code.trim().toUpperCase();
  const codeRef = doc(db, "invitationCodes", codeId);

  await runTransaction(db, async (tx) => {
    const codeSnap = await tx.get(codeRef);
    if (!codeSnap.exists()) throw new Error("Invalid invitation code.");

    const codeData = codeSnap.data();
    if (codeData.used && codeData.usedBy !== authUid) {
      throw new Error("Invitation code already used.");
    }

    const countryCode = codeData.countryCode;
    const countryName = codeData.countryName;
    const countryRef = doc(db, "countries", authUid);

    tx.set(
      codeRef,
      {
        used: true,
        usedBy: authUid,
        usedAt: serverTimestamp(),
      },
      { merge: true }
    );

    tx.set(
      countryRef,
      {
        countryCode,
        countryName,
        status: "registered",
        teamCount: 0,
        memberCount: 0,
      },
      { merge: true }
    );
  });

  return authUid;
}
```

---

## 5. Admin Account Design

### 5.1 Requirements

* Admin is also a country account:

  * Has a normal Auth user.
  * Has a normal `/countries/{authUid}` doc.
  * Uses the same UI as any country to manage its own data.

* Additionally, admin can:

  * View all countries.
  * View and edit any country’s teams/members.
  * Manage invitation codes.

### 5.2 Admin marker in Firestore

Use a dedicated collection:

* `/admins/{authUid}`

**Example document**

```jsonc
// /admins/{authUid}
{
  "createdAt": "2025-01-01T00:00:00Z",
  "createdBy": "another-admin-authUid"
}
```

To promote a user to admin:

1. Create the user (same registration flow).
2. Create a document in `/admins/{authUid}`.

Admin still has its own `/countries/{authUid}` and functions like a normal country.

---

### 5.3 Checking admin on the client

After login:

```ts
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const authUid = user.uid;

  // Country doc for this account
  const countryRef = doc(db, "countries", authUid);

  // Admin flag
  const adminRef = doc(db, "admins", authUid);
  const adminSnap = await getDoc(adminRef);
  const isAdmin = adminSnap.exists();

  if (isAdmin) {
    // Show both:
    // - normal country UI (bound to /countries/{authUid})
    // - admin dashboard (list all countries, etc.)
  } else {
    // Show only the normal country UI
  }
});
```

---

## 6. Firestore Security Rules (authId-centric)

### 6.1 Helper functions

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    // Admin if there is a doc /admins/{authUid}
    function isAdmin() {
      return isSignedIn()
        && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // The owner of a country is the user whose authUid == document id
    function isCountryOwner(countryAuthUid) {
      return isSignedIn() && request.auth.uid == countryAuthUid;
    }
```

### 6.2 Countries and subcollections

```js
    // /countries/{authUid}
    match /countries/{authUid} {
      allow read, write: if isAdmin() || isCountryOwner(authUid);
    }

    // /countries/{authUid}/teams/{teamId}
    match /countries/{authUid}/teams/{teamId} {
      allow read, write: if isAdmin() || isCountryOwner(authUid);
    }

    // /countries/{authUid}/members/{memberId}
    match /countries/{authUid}/members/{memberId} {
      allow read, write: if isAdmin() || isCountryOwner(authUid);
    }
```

* Normal country account:

  * Can only read/write `/countries/{theirUid}` and its subcollections.
* Admin:

  * Can read/write all countries and all subcollections.

### 6.3 Invitation codes

```js
    // /invitationCodes/{code}
    match /invitationCodes/{code} {
      // Anyone can read a code to validate it on the registration form
      allow get: if true;

      // Only admins can create/delete codes
      allow create, delete: if isAdmin();

      // Only logged-in users can mark a code as used; idempotent for same user
      allow update: if isSignedIn() && (
        // from unused to used
        resource.data.used == false ||
        // or same user writing again (idempotent)
        (resource.data.used == true &&
         resource.data.usedBy == request.auth.uid)
      );
    }
```

### 6.4 Admins collection

```js
    // /admins/{authUid}
    match /admins/{authUid} {
      // Only admins manage admin list
      allow read, write: if isAdmin();
    }
  }
}
```

---

## 7. Typical Access Patterns

### 7.1 Country user

* After login:

  * Their country doc: `/countries/{authUid}`
  * Teams: `/countries/{authUid}/teams`
  * Members: `/countries/{authUid}/members`

Everything is keyed by `authUid`.

### 7.2 Admin user

* Uses the same paths for their own data:

  * `/countries/{authUid}` (their own country)
  * `/countries/{authUid}/teams`
  * `/countries/{authUid}/members`

* Additionally, admin dashboard can:

  * Query all countries: `collection(db, "countries")`
  * Open any country: `/countries/{anyAuthUid}`
  * Inspect/manage `/invitationCodes`
  * Manage `/admins`

Admin behaves exactly like a normal country account for its own country data, plus extra rights for all countries.

---

## 8. Summary

* **Primary key = `authUid`**
  All country data is stored under `/countries/{authUid}` and accessed via the authenticated user’s UID.

* **Data model**

  * `/countries/{authUid}` with embedded contact/transport/payment and counters.
  * `/countries/{authUid}/teams/{teamId}`
  * `/countries/{authUid}/members/{memberId}` with `teamId`.

* **Invitation codes**

  * `/invitationCodes/{code}` with `countryCode`, `countryName`, and `used` tracking.
  * On registration, validate code → create Auth user → transaction:

    * Mark code used.
    * Create `/countries/{authUid}`.

* **Admin**

  * Normal account with its own `/countries/{authUid}`.
  * Extra rights via `/admins/{authUid}` and rules.
  * Can both act as a country and run a global admin dashboard.

This structure keeps everything centered on `authId`, minimizes special cases, and lets admin accounts behave exactly like normal country accounts while still providing admin functionality.

```
```
