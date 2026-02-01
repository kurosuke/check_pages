-- Enable required extensions for scheduled jobs
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Drop existing cron job if exists (for re-running migration)
do $$
begin
  perform cron.unschedule('check-runner-periodic');
exception
  when undefined_object then
    null; -- Job doesn't exist, that's fine
end $$;

-- Schedule the check-runner function to run every hour
-- The job will POST to the Edge Function endpoint
-- Note: Replace <project-ref> with your actual Supabase project reference ID
select cron.schedule(
  'check-runner-periodic',
  '0 * * * *', -- Every hour at minute 0 (cron format)
  $$
  select
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/check-runner',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
      ),
      body := jsonb_build_object()
    ) as request_id;
  $$
);

-- Create a table to store Supabase settings (URL and service key)
-- This allows the cron job to access these values dynamically
create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Grant permissions
grant select on app_settings to authenticated;
grant all on app_settings to service_role;

comment on table app_settings is 'Application-level settings for cron jobs and background tasks';

-- Note: You need to manually insert your Supabase URL and service role key
-- Run these commands via SQL editor or Supabase CLI after migration:
--
-- insert into app_settings (key, value) values
--   ('supabase_url', 'https://YOUR-PROJECT-REF.supabase.co'),
--   ('supabase_service_role_key', 'YOUR-SERVICE-ROLE-KEY')
-- on conflict (key) do update set value = excluded.value, updated_at = now();
--
-- Then set runtime config (these are used by the cron job):
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR-PROJECT-REF.supabase.co';
-- ALTER DATABASE postgres SET app.settings.supabase_service_role_key = 'YOUR-SERVICE-ROLE-KEY';
