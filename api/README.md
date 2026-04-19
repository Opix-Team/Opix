# Opix Public API

> ⚠️ The `.ts` files in this folder are **kept for reference only** — they do NOT run.
> Lovable hosts a static React app and cannot serve `/api/*` endpoints.
> The real, production API runs as **Supabase Edge Functions**.

## Base URL

```
https://coatunyealgfrmpszpsu.supabase.co/functions/v1
```

> A future custom domain (`https://api.opix.io`) can be pointed at this gateway.

## Authentication

All endpoints (except where noted) require an API key issued from the dashboard:

```
Authorization: Bearer opx_<your-key>
```

Keys are SHA-256 hashed at rest and validated on every request. Each successful call
updates `api_keys.last_used_at`.

## Response shape

All endpoints return a uniform JSON envelope:

```jsonc
// success
{ "data": ... }

// error
{ "error": { "code": "unauthorized" | "forbidden" | "not_found" | "validation_error" | "method_not_allowed" | "server_error", "message": "..." } }
```

## Endpoints (v1)

| Method | Path                      | Required scope  | Description                          |
|--------|---------------------------|-----------------|--------------------------------------|
| POST   | `/api-keys-validate`      | —               | Validate the calling API key.        |
| GET    | `/authorizations-list`    | `integrations`  | List your authorizations.            |
| POST   | `/authorizations-create`  | `integrations`  | Create an authorization (OAuth-like app). |
| POST   | `/authorizations-revoke`  | `integrations`  | Deactivate an authorization by `id`. |
| GET    | `/events-list`            | `events`        | List integration log events. Query: `limit`, `since`. |
| POST   | `/events-track`           | `events`        | Record an event for one of your integrations. |

### Bodies

**POST /authorizations-create**
```json
{
  "app_name": "My App",
  "app_url": "https://...",
  "app_icon": "https://...",
  "description": "...",
  "redirect_uri": "https://.../callback",
  "scopes": ["read", "write"]
}
```

**POST /authorizations-revoke**
```json
{ "id": "<authorization-uuid>" }
```

**POST /events-track**
```json
{
  "integration_id": "<integration-uuid>",
  "event_type": "user.signed_in",
  "payload": { },
  "response": { },
  "status_code": 200
}
```

## Example

```bash
curl -X POST \
  https://coatunyealgfrmpszpsu.supabase.co/functions/v1/api-keys-validate \
  -H "Authorization: Bearer opx_xxx"
```

## Notes

- Invites endpoints are intentionally **not** part of the public API.
- Rate limiting and webhook signature verification are planned follow-ups.
