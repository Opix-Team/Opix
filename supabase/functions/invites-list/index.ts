import { corsHeaders } from "../_shared/cors.ts";
import { ok, fail } from "../_shared/responses.ts";
import { validateApiKey, adminClient } from "../_shared/auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return fail("method_not_allowed", "Use GET", 405);

  const v = await validateApiKey(req, "invites");
  if (!v.ok) return v.response;

  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);
  const status = url.searchParams.get("status");
  const authorization_id = url.searchParams.get("authorization_id");

  const sb = adminClient();
  let query = sb.from("invites")
    .select("*")
    .eq("created_by", v.user_id)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) query = query.eq("status", status);
  if (authorization_id) query = query.eq("authorization_id", authorization_id);

  const { data, error } = await query;
  if (error) return fail("server_error", error.message, 500);
  return ok(data);
});
