alter table policies
  add column if not exists user_context_json jsonb default '{}'::jsonb;
