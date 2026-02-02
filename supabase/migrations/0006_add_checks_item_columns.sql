-- Add per-check item metadata
alter table if exists checks
  add column if not exists item_id text,
  add column if not exists item_published_at timestamptz;

comment on column checks.item_id is 'Identifier of the content item observed during this check (e.g., episode ID)';
comment on column checks.item_published_at is 'Published timestamp of the content item observed during this check';
