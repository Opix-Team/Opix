import type { Tables } from "@/integrations/supabase/types";

export type Authorization = Tables<"authorizations">;
export type ApiKey = Tables<"api_keys">;
export type Invite = Tables<"invites">;
export type InviteEvent = Tables<"invite_events">;
export type Profile = Tables<"profiles">;
