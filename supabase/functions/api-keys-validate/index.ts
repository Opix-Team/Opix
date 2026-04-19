import { corsHeaders } from "../_shared/cors.ts";
import { ok, fail } from "../_shared/responses.ts";
import { validateApiKey } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "GET") {
    return fail("method_not_allowed", "Use GET or POST", 405);
  }

  const result = await validateApiKey(req);
  if (!result.ok) return result.response;

  return ok({
    valid: true,
    user_id: result.user_id,
    scopes: result.scopes,
  });
});
