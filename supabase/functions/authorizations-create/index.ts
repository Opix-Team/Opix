import { corsHeaders } from "../_shared/cors.ts";
import { ok, fail } from "../_shared/responses.ts";
import { validateApiKey, adminClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return fail("method_not_allowed", "Use POST", 405);

  const v = await validateApiKey(req, "integrations");
  if (!v.ok) return v.response;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return fail("validation_error", "Invalid JSON body", 400);
  }

  const { app_name, app_url, app_icon, description, redirect_uri, scopes } = body ?? {};
  if (!app_name || typeof app_name !== "string") {
    return fail("validation_error", "app_name is required", 400);
  }

  const sb = adminClient();
  const { data, error } = await sb
    .from("authorizations")
    .insert({
      user_id: v.user_id,
      app_name,
      app_url: app_url ?? null,
      app_icon: app_icon ?? null,
      description: description ?? null,
      redirect_uri: redirect_uri ?? null,
      scopes: Array.isArray(scopes) ? scopes : [],
    })
    .select()
    .single();

  if (error) return fail("server_error", error.message, 500);
  return ok(data, 201);
});
