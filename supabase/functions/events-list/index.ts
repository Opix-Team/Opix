import { corsHeaders } from "../_shared/cors.ts";
import { ok, fail } from "../_shared/responses.ts";
import { validateApiKey, adminClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return fail("method_not_allowed", "Use GET", 405);

  const v = await validateApiKey(req, "events");
  if (!v.ok) return v.response;

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);
  const since = url.searchParams.get("since");

  const sb = adminClient();
  // Events are stored in invite_events scoped via integrations the user owns.
  // For the public API, we expose integration_logs the user owns.
  let query = sb
    .from("integration_logs")
    .select("id, integration_id, event_type, payload, response, status_code, created_at, integrations!inner(owner)")
    .eq("integrations.owner", v.user_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (since) query = query.gte("created_at", since);

  const { data, error } = await query;
  if (error) return fail("server_error", error.message, 500);
  return ok(data);
});
