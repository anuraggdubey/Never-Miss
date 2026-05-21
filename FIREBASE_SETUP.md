# NeverMiss PWA + Firebase Setup

## What is implemented

- Next.js App Router migration
- Mobile-first installable PWA shell
- Web manifest with Android-friendly icons and shortcuts
- Next PWA caching with offline fallback page
- Firebase Auth with Google sign-in
- Firestore-backed moments, settings, and wish drafts
- Firestore persistent local cache for offline data access
- Firebase Cloud Messaging token registration flow
- Server-side push test endpoint
- Cron-ready reminder dispatch endpoint

## Environment variables

Use [.env.example](/c:/Projects/NeverMiss/.env.example:1) as the source of truth.

Required client values:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

Required server values:

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `CRON_SECRET`

## Firestore structure

- `users/{uid}`
  - root profile fields
- `users/{uid}/meta/settings`
- `users/{uid}/moments/{momentId}`
- `users/{uid}/wishes/{wishId}`
- `users/{uid}/devices/{token}`

## Firebase Console steps still required

1. In Authentication, keep Google enabled.
2. In Authentication -> Settings -> Authorized domains, add your real host and `localhost`.
3. In Firestore, publish [firestore.rules](/c:/Projects/NeverMiss/firestore.rules:1).
4. In Cloud Messaging, generate a Web Push certificate and put the public VAPID key into `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
5. If you want scheduled reminders, configure a scheduler to call `POST /api/cron/reminders` with `Authorization: Bearer <CRON_SECRET>`.

## Important security fixes

1. Rotate the exposed Firebase Admin private key immediately.
2. Move secrets into deployment environment variables instead of relying on a committed local `.env`.
3. Never expose `FIREBASE_ADMIN_*` values to client bundles.

## Current extension status

The main app is now PWA-ready and Firebase-backed. The Chrome extension still uses its own local capture flow and has not been upgraded to share authenticated Firebase state yet.

## Production note

`npm run build` currently passes. `npm audit --omit=dev` still reports transitive vulnerabilities, mainly in the `@ducanh2912/next-pwa` dependency chain, so a later hardening pass should evaluate moving from `next-pwa` to a newer maintained service-worker stack once product requirements allow it.
