// Shared helper to fire callbacks to an authorized app's redirect_uri.
// Mirrors the behaviour of src/lib/opix-callbacks.ts but runs server-side.
import { adminClient } from "./auth.ts";

export interface CallbackOptions {
  authorization_id: string;
  event: string;
  data: unknown;
}

export interface CallbackResult {
  attempted: boolean;
  ok: boolean;
  status?: number;
  error?: string;
  url?: string;
}

export async function sendAuthorizationCallback(
  { authorization_id, event, data }: CallbackOptions,
): Promise<CallbackResult> {
  const sb = adminClient();
  const { data: auth, error } = await sb
    .from("authorizations")
    .select("id, client_id, redirect_uri, is_active, app_name")
    .eq("id", authorization_id)
    .maybeSingle();

  if (error || !auth) return { attempted: false, ok: false, error: "authorization not found" };
  if (!auth.is_active || !auth.redirect_uri) {
    return { attempted: false, ok: false, error: "inactive or no redirect_uri" };
  }

  const payload = {
    event,
    client_id: auth.client_id,
    authorization_id: auth.id,
    timestamp: Date.now(),
    data,
  };

  try {
    // Best-effort, with a short timeout so a slow webhook doesn't stall the request.
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(auth.redirect_uri, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Opix-Client-ID": auth.client_id,
        "X-Opix-Event": event,
      },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return { attempted: true, ok: res.ok, status: res.status, url: auth.redirect_uri };
  } catch (e) {
    return { attempted: true, ok: false, error: (e as Error).message, url: auth.redirect_uri };
  }
}
