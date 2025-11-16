# IOL 2025 Registration App
## Structure
- Frontend: Next.js, ShadCN UI, React Hook Form, Zod
- Backend: Firebase Authentication, Firestore, Cloud Functions
## Quick start
1. Create a Firebase project. Enable Authentication (Email/Password + Google), Firestore, and Functions.
2. Copy `.env.local.example` to `.env.local` and set values.
3. Install and run:
   ```bash
   npm i
   npm run dev
   ```
4. Initialize Firebase in this project if you haven't already (this creates `firebase.json` and links the rules file):

   ```bash
   npx firebase init firestore
   ```

   When prompted for the rules file, you can enter `firestore.rules`.
5. Deploy the rules to your Firebase project:

   ```bash
   npx firebase deploy --only firestore:rules
   ```
6. Manually create the first invitation code document in Firestore under `/invitationCodes/{code}` to onboard the first country delegate.
7. Create an admin user as described below.
8. After setting up the admin account, please change the Firestore rules to restrict access appropriately.

### How to create an admin user
1. Open the Firebase Console and navigate to Firestore.
2. Create a new document in the `admins` collection with the UID of the user you want to grant admin privileges to. For the fields, please add a timestamp entry `created_at` and a string entry `created_by`.

### How to create an invitation code
1. Navigate to the Firestore console and select the `invitationCodes` collection.
2. Click "Add Document" and enter a unique code as the document ID. For the fields, please refer to `createInviteCode` from `@/services/firebaseApi.ts`.

## Available scripts
- `npm run dev` – Start the Next.js dev server with Fast Refresh.
- `npm run build` – Production build output (`.next/`).
- `npm run start` – Run the production build locally.
- `npm run lint` – ESLint with the Next.js config (recommended before every commit).
- `npm run typecheck` – Strict TypeScript check without emitting files.

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
- `src/components` The `UI` folders contain ShadCN components and layout pieces. The remaining are components specific to features like payment flow and data tables.
- `src/schemas` Zod schemas per domain.
- `src/services/` Firebase service functions called by the UI. The functions for Authentication and payment processing are in their own files.
- `src/context/AuthProvider.tsx` Auth state and claims.
- `src/lib` Firebase init and role helpers.

## Features
- Invitation-based onboarding that creates a `countries/{uid}` document inside a Firestore transaction.
- Country dashboard for contacts, transport, members, teams, payments, and payment flow persistence.
- Role-aware sidebar powered by `AuthProvider` + Firestore snapshots so countries see their own navigation and admins get drill-down tools.
- Admin console with reusable `DataTable` views for countries, contacts, teams, members, and payments, plus per-country detail pages.
- Payment flow that stores registration + confirmation data, pricing totals, and step state directly in the `payment` field of the country document.

## Notes
- Admin-only sections are conditionally rendered client-side and should also be protected with Firestore/Functions on the backend.
- Invitation code creation is implemented at `createInviteCode` in `src/services/firebaseApi.ts`, writing to `/invitationCodes/{code}`.
- Use Firestore structure and rules per the design manual.

## Authentication & onboarding
1. Admin creates an invitation code via the Admin → Invites page (writes to `/invitationCodes/{code}`).
2. A country delegate signs up with email/password or Google using that code.
3. Within a single Firestore transaction the code is marked as used and a baseline `countries/{uid}` document is created.
4. On first login the sidebar listens to `countries/{uid}` so the displayed name always matches `country_name` (even if the Firebase Auth profile changes later).

## Data model snapshot
- `/countries/{countryId}` – Primary document per country. Stores metadata plus embedded contact, transport, and payment objects.
- `/countries/{countryId}/teams` – Team documents. Referenced by members via the `team` field.
- `/countries/{countryId}/members` – Member documents. Role determines leader/contestant/observer.
- `/admins/{uid}` – Grants admin rights (consumed by `AuthProvider`).
- `/invitationCodes/{code}` – Invitation management (used during registration only).


## Admin dashboard

The admin console now lives under `/admin` and is split into focused subpages, each using the shared `DataTable` component for filtering/exporting:

- **Overview** – key totals plus a country table with drill-down links.
- **Countries** – all country documents with team/member counts and last-updated timestamps.
- **Contacts** – primary/secondary contact cards per country for quick outreach.
- **Teams** – flattened list of every team grouped by country.
- **Members** – all members across countries, ideal for diet/language pivots.
- **Payments** – payment step, plan, and totals for every country.

Navigate between subpages via the pills rendered in `src/app/admin/layout.tsx`. Selecting a country from the Countries table opens `/admin/countries/[countryId]`, which surfaces contact, payment, team, and member data for that country in one view.

### Firestore usage scenarios

1. **Country delegate journey**
   - After authentication, the delegate’s UID matches `/countries/{countryId}`.
   - Teams live in `/countries/{countryId}/teams` and members in `/countries/{countryId}/members`.
2. **Admin overview**
   - `adminListCountrySummaries()` queries `/countries`, then counts teams/members by scanning the respective subcollections.
   - Team and member lists reuse those subcollections to keep data colocated under each country document, mirroring the Firestore console tree (`countries/{id}/teams`, `countries/{id}/members`).
3. **Ad-hoc reports (diet/language)**
   - The Members table lets you filter/export on the client.
   - If you ever need cross-country queries directly in Firestore, consider denormalizing into a `/memberIndex` collection, but keep everything under `/countries/{id}` unless that use case becomes critical.

This structure makes it easy to click into a single country in the Firestore console and see all related data, matching the mental model described in the design brief.

## Verification & quality gates
- Run `npm run lint` and `npm run typecheck` before pushing changes; both commands execute quickly and catch most regressions.
- Payment and admin flows rely on authenticated Firestore calls. When developing locally, ensure Firebase Emulator Suite or a staging project is configured in `.env.local`.
- When updating Firestore security rules, redeploy with `npx firebase deploy --only firestore:rules` (see section below) and keep the rules file in sync with any new collections/fields.

## Firestore rules

To deploy the Firestore security rules defined in `firestore.rules`:

1. Make sure the Firebase CLI is installed and you are logged in:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. Initialize Firestore in this project if you haven't already (this creates `firebase.json` and links the rules file):

   ```bash
   npx firebase init firestore
   ```

   When prompted for the rules file, you can enter `firestore.rules`.

3. Deploy the rules to your Firebase project:

   ```bash
   npx firebase deploy --only firestore:rules
   ```

Make sure your active Firebase project (`firebase use`) matches the project configured in your `.env.local`.

## Unfinished features & todos
- [ ] Verification steps for payments (e.g. email confirmation).

- (Notes: I use resend for the email service in the original plan.)
- [ ] Limit team/member counts based on selected plan.
- [ ] Team limit of city tour and excursions.
