import { corsHeaders } from "../_shared/cors.ts";
import { ok, fail } from "../_shared/responses.ts";
import { validateApiKey, adminClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return fail("method_not_allowed", "Use GET", 405);

  const v = await validateApiKey(req, "integrations");
  if (!v.ok) return v.response;

  const sb = adminClient();
  const { data, error } = await sb
    .from("authorizations")
    .select("id, app_name, app_url, app_icon, description, client_id, redirect_uri, scopes, is_active, last_used_at, created_at, updated_at")
    .eq("user_id", v.user_id)
    .order("created_at", { ascending: false });

  if (error) return fail("server_error", error.message, 500);
  return ok(data);
});
