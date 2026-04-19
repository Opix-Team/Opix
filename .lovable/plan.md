
## Goal
Make `/api` a real, callable, SDK-friendly surface. Today the `/api/*.ts` files don't run — Lovable hosts a static React app, and they import the browser Supabase client. External SDKs (sdk.ts/sdk.js) need real HTTP endpoints. The right home is **Supabase Edge Functions**, which Lovable Cloud auto-deploys.

Also fix the current build error (`opix-callbacks.ts` imports missing `@/types`).

## Proposed architecture

```text
supabase/functions/
  _shared/
    cors.ts          CORS headers
    auth.ts          validateApiKey(req, requiredScope) — single source of truth
    responses.ts     ok(data) / fail(code, message, status)
  api-keys-validate/index.ts
  authorizations-list/index.ts
  authorizations-create/index.ts
  authorizations-revoke/index.ts
  events-list/index.ts
  events-track/index.ts
  invites-list/index.ts        (optional, see Q3)
  invites-create/index.ts      (optional, see Q3)
```

Each function:
- Handles `OPTIONS` preflight
- Validates `Authorization: Bearer opx_...` via shared helper (SHA-256 hash → `api_keys` lookup → scope check → updates `last_used_at`)
- Uses service-role client, scoped to the API key's `user_id`
- Returns a uniform shape:
  - success → `{ data: ... }`
  - error → `{ error: { code, message } }` with proper HTTP status

This gives the SDK one consistent error contract.

## SDK-facing base URL

External SDKs will call:
```text
https://coatunyealgfrmpszpsu.supabase.co/functions/v1/<endpoint>
```
Lovable's static host can't serve `/api/*` directly. If you want pretty `https://api.opix.io/...` URLs later, point a custom domain at the functions gateway — flagged as a follow-up.

## Cleanup
- Delete the 8 dead files in `/api/**` and replace with `api/README.md` documenting the real endpoints, auth header, scopes, and error codes — so SDK authors land in the right place.
- Create `src/types/index.ts` exporting `Authorization`, `ApiKey`, `Invite`, `InviteEvent` from the generated Supabase types.
- Fix `src/lib/opix-callbacks.ts` to import from `@/types`.

## Endpoint contract (v1)

| Method | Endpoint | Scope | Body / Query |
|---|---|---|---|
| POST | `api-keys-validate` | — | (key in header) |
| GET  | `authorizations-list` | `integrations` | — |
| POST | `authorizations-create` | `integrations` | `{ app_name, app_url, redirect_uri, scopes[] }` |
| POST | `authorizations-revoke` | `integrations` | `{ id }` |
| GET  | `events-list` | `events` | `?limit&since` |
| POST | `events-track` | `events` | `{ event_type, event_data }` |
| GET  | `invites-list` | `invites` | `?status&limit` |
| POST | `invites-create` | `invites` | `{ type, source?, expires_at? }` |

## Out of scope for this step
- Publishing an actual `@opix/sdk` npm package (next step, after API is solid).
- Rate limiting, webhooks signing — follow-ups.
- New tables.

## Three quick decisions I need from you
1. **Pretty URLs** — ship now on `*.supabase.co/functions/v1/*`, or also scaffold for a future `api.opix.io` custom domain?
2. **Old `/api` folder** — delete and replace with a README (recommended), or keep with a DEPRECATED banner?
3. **Invites endpoints** — include in the public API, or drop since the UI was removed?
