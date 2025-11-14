# Event Registration Web App (Next.js + Firebase)

This scaffold integrates your functional spec and data model. UI is App Router based with a left sidebar, breadcrumb, and feature pages. Forms use react-hook-form with Zod schemas. Firebase integration is abstracted behind a service layer.

## Quick start
1. Create a Firebase project. Enable Authentication (Email/Password + Google), Firestore, and Functions.
2. Copy `.env.local.example` to `.env.local` and set values.
3. Install and run:
   ```bash
   npm i
   npm run dev
   ```

## Environment
Create `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Structure
- `src/app` App Router pages for Dashboard, Contacts, Transport, Teams, Members, Payments, Admin.
- `src/components` ShadCN-style primitives and layout components.
- `src/schemas` Zod schemas per domain.
- `src/services/firebaseApi.ts` Aliases to implement later. The UI calls only these.
- `src/context/AuthProvider.tsx` Auth state and claims.
- `src/lib` Firebase init and role helpers.

## Notes
- Admin-only sections are conditionally rendered client-side and should also be protected with Firestore/Functions on the backend.
- Invitation code creation is stubbed at `createInviteCode`. Wire it to your Callable Function.
- Use Firestore structure and rules per the design manual.
