alter table policy_summaries
  add column if not exists important_conditions_json jsonb default '[]'::jsonb;
