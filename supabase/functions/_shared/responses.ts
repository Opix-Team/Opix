import { corsHeaders } from "./cors.ts";

export function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export type ErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "method_not_allowed"
  | "server_error";

export function fail(code: ErrorCode, message: string, status: number) {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
