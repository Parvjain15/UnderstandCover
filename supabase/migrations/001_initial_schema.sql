-- Enable pgvector extension
create extension if not exists vector;

-- Users profile table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now(),
  subscription_tier text default 'free'
);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Policies table
create table if not exists public.policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  file_url text not null,
  policy_nickname text not null,
  policy_type text not null,
  jurisdiction text default 'UK',
  owner_type text not null,
  insurer_name text,
  policyholder_name text,
  start_date date,
  end_date date,
  status text default 'uploading',
  processing_error text,
  total_pages integer,
  uploaded_at timestamptz default now()
);

-- Policy pages (raw extracted text per page)
create table if not exists public.policy_pages (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  page_number integer not null,
  raw_text text not null,
  ocr_used boolean default false
);

-- Policy chunks (for vector search)
create table if not exists public.policy_chunks (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.policies(id) on delete cascade,
  page_number integer not null,
  section_title text,
  clause_reference text,
  chunk_text text not null,
  chunk_index integer not null,
  embedding vector(768)
);

-- Policy summaries (LLM-generated structured summary)
create table if not exists public.policy_summaries (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid unique not null references public.policies(id) on delete cascade,
  overview_json jsonb,
  coverage_json jsonb,
  exclusions_json jsonb,
  limits_json jsonb,
  risk_flags_json jsonb,
  generated_at timestamptz default now()
);

-- Questions and answers
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  policy_id uuid not null references public.policies(id) on delete cascade,
  question_text text not null,
  answer_json jsonb not null,
  created_at timestamptz default now()
);

-- AI request/response logs
create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  policy_id uuid references public.policies(id) on delete set null,
  request_type text,
  prompt_sent text,
  chunks_retrieved jsonb,
  llm_response text,
  parsed_response jsonb,
  citation_verification_passed boolean,
  latency_ms integer,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists policies_user_id_idx on public.policies(user_id);
create index if not exists policy_pages_policy_id_idx on public.policy_pages(policy_id);
create index if not exists policy_chunks_policy_id_idx on public.policy_chunks(policy_id);
create index if not exists questions_policy_id_idx on public.questions(policy_id);
create index if not exists questions_user_id_idx on public.questions(user_id);

-- Vector similarity search index
create index if not exists policy_chunks_embedding_idx on public.policy_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Row Level Security
alter table public.users enable row level security;
alter table public.policies enable row level security;
alter table public.policy_pages enable row level security;
alter table public.policy_chunks enable row level security;
alter table public.policy_summaries enable row level security;
alter table public.questions enable row level security;
alter table public.ai_logs enable row level security;

-- RLS Policies: users can only see their own data
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can view own policies" on public.policies
  for all using (auth.uid() = user_id);

create policy "Users can view pages of own policies" on public.policy_pages
  for select using (
    exists (select 1 from public.policies where policies.id = policy_pages.policy_id and policies.user_id = auth.uid())
  );

create policy "Users can view chunks of own policies" on public.policy_chunks
  for select using (
    exists (select 1 from public.policies where policies.id = policy_chunks.policy_id and policies.user_id = auth.uid())
  );

create policy "Users can view summaries of own policies" on public.policy_summaries
  for select using (
    exists (select 1 from public.policies where policies.id = policy_summaries.policy_id and policies.user_id = auth.uid())
  );

create policy "Users can manage own questions" on public.questions
  for all using (auth.uid() = user_id);

create policy "Users can view own AI logs" on public.ai_logs
  for select using (auth.uid() = user_id);

-- Vector similarity search function (used by ask-policy route)
create or replace function match_policy_chunks(
  policy_id_input uuid,
  query_embedding vector(768),
  match_count int default 12
)
returns table (
  id uuid,
  policy_id uuid,
  page_number integer,
  section_title text,
  clause_reference text,
  chunk_text text,
  chunk_index integer,
  similarity float
)
language sql stable as $$
  select
    pc.id,
    pc.policy_id,
    pc.page_number,
    pc.section_title,
    pc.clause_reference,
    pc.chunk_text,
    pc.chunk_index,
    1 - (pc.embedding <=> query_embedding) as similarity
  from public.policy_chunks pc
  where pc.policy_id = policy_id_input
    and pc.embedding is not null
  order by pc.embedding <=> query_embedding
  limit match_count;
$$;
