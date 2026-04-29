DROP TRIGGER IF EXISTS queue_site_content_subscriber_updates ON public.site_content;
DROP FUNCTION IF EXISTS public.queue_subscriber_update_notifications();
DROP TABLE IF EXISTS public.subscriber_update_notifications;