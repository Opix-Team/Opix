
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_api_key() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_invite_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_invite_status_change() FROM PUBLIC, anon, authenticated;
