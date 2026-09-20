# Passkey sign-in for Opix

Add passkeys (fingerprint, face, or device screen lock) as an extra security step after email and password.

## How it will work

1. You sign in with email and password as usual.
2. If your account has a passkey saved, Opix asks you to confirm with your device before the dashboard opens.
3. You can add a passkey right after sign-up, or later from a new Security page in the dashboard.
4. The Security page lists your saved devices with the date added, and lets you remove any of them.

If you have no passkey saved, nothing changes — you go straight in.

## Screens

- Sign-up: after the account is created, an optional "Add a passkey" step.
- Sign-in: a confirm-with-your-device step that appears only when a passkey exists.
- Dashboard > Security: list of devices, "Add this device" button, remove button per device.

## Recovery

Losing every device would lock you out of the extra step, so the Security page will also generate one-time backup codes you can save. Entering a backup code passes the step instead of the device.

## Technical notes

- New table `public.passkeys`: `id`, `user_id`, `credential_id` (unique), `public_key`, `counter`, `transports`, `device_label`, `created_at`, `last_used_at`. RLS: owner-only select/delete; inserts and updates go through edge functions. GRANT select/delete to `authenticated`, ALL to `service_role`.
- New table `public.passkey_backup_codes`: `user_id`, `code_hash`, `used_at`. Owner-only select; no client insert.
- New table `public.passkey_challenges`: short-lived `user_id`, `challenge`, `type`, `expires_at`; service-role only.
- Four edge functions using `@simplewebauthn/server` from esm.sh, all requiring a valid Supabase user JWT (not an API key):
  - `passkey-register-options`, `passkey-register-verify`
  - `passkey-auth-options`, `passkey-auth-verify`
  RP ID derived from the request origin so preview and published domains both work.
- Client helper `src/lib/passkeys.ts` wrapping `navigator.credentials` plus base64url encoding, with a capability check so unsupported browsers fall back to backup codes.
- Gate: `useAuth` gains `passkeyVerified`. After `signInWithPassword`, the app calls `passkey-auth-options`; if the account has passkeys, `ProtectedRoute` renders the challenge screen instead of the page until `passkey-auth-verify` succeeds. The verified flag is stored per session in `sessionStorage`. This is an in-app gate — the Supabase session itself exists from password sign-in onward, so it raises the bar in the UI rather than replacing server-side auth.
- Routes: `/dashboard/security` page, sidebar entry in `DashboardLayout`.
