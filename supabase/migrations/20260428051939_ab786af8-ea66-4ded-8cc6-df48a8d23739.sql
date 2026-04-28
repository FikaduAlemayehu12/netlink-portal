REVOKE ALL ON FUNCTION public.track_visitor(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_visitor(text) FROM anon;
REVOKE ALL ON FUNCTION public.track_visitor(text) FROM authenticated;

REVOKE ALL ON FUNCTION public.ping_online(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ping_online(text) FROM anon;
REVOKE ALL ON FUNCTION public.ping_online(text) FROM authenticated;

REVOKE ALL ON FUNCTION public.get_online_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_online_count() FROM anon;
REVOKE ALL ON FUNCTION public.get_online_count() FROM authenticated;

REVOKE ALL ON FUNCTION public.get_subscriber_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_subscriber_count() FROM anon;
REVOKE ALL ON FUNCTION public.get_subscriber_count() FROM authenticated;
