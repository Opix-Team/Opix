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
  const { id } = body ?? {};
  if (!id || typeof id !== "string") {
    return fail("validation_error", "id is required", 400);
  }

  const sb = adminClient();
  const { data, error } = await sb
    .from("authorizations")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", v.user_id)
    .select()
    .maybeSingle();

  if (error) return fail("server_error", error.message, 500);
  if (!data) return fail("not_found", "Authorization not found", 404);
  return ok(data);
});
