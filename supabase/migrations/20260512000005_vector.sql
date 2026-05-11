-- Phase 1b — vector search over PH legal corpus.
-- Stores embedded chunks of statutes, codes, and (later) SC decisions.
-- The match_legal_chunks RPC powers retrieval-augmented Q&A.

create extension if not exists vector;

-- Documents — one row per statute / code / decision / regulation.
create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  doc_type text not null check (doc_type in (
    'constitution',
    'code',
    'republic_act',
    'supreme_court_decision',
    'executive_order',
    'admin_issuance',
    'local_ordinance'
  )),
  source_url text,
  jurisdiction text not null default 'PH',
  practice_areas text[] not null default '{}',
  effective_date date,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.legal_documents is
  'PH legal source documents — Constitution, codes, RAs, SC decisions, etc.';

create index legal_documents_doc_type_idx on public.legal_documents (doc_type);
create index legal_documents_practice_areas_idx
  on public.legal_documents using gin (practice_areas);

-- Chunks — embedded slices of each document. One document → many chunks.
-- Voyage AI voyage-law-2 returns 1024d vectors.
create table public.legal_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.legal_documents(id) on delete cascade,
  chunk_index int not null,
  text text not null,
  embedding vector(1024) not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

comment on table public.legal_chunks is
  'Embedded text slices of legal documents, used for RAG retrieval.';

-- HNSW index for fast cosine-similarity search at query time.
create index legal_chunks_embedding_hnsw
  on public.legal_chunks
  using hnsw (embedding vector_cosine_ops);

create index legal_chunks_document_id_idx on public.legal_chunks (document_id);

-- ---------------------------------------------------------------------------
-- RLS — corpus is read-only for authenticated users; writes are service-role.
-- ---------------------------------------------------------------------------

alter table public.legal_documents enable row level security;
alter table public.legal_chunks enable row level security;

-- Authenticated users can read every document.
create policy "legal_documents: read all (authenticated)"
  on public.legal_documents
  for select
  to authenticated
  using (true);

-- Authenticated users can read every chunk (so retrieval RPC works).
create policy "legal_chunks: read all (authenticated)"
  on public.legal_chunks
  for select
  to authenticated
  using (true);

-- Anonymous users get no access. The service-role key bypasses RLS, so the
-- ingest script (using SUPABASE_SERVICE_ROLE_KEY) can write freely.

-- ---------------------------------------------------------------------------
-- match_legal_chunks RPC — top-k retrieval used by the chat route.
-- Returns chunks with their parent document metadata, ordered by similarity.
-- ---------------------------------------------------------------------------

create or replace function public.match_legal_chunks(
  query_embedding vector(1024),
  match_count int default 25,
  practice_area_filter text[] default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  chunk_index int,
  chunk_text text,
  similarity float,
  doc_title text,
  doc_type text,
  source_url text,
  practice_areas text[],
  effective_date date,
  doc_metadata jsonb
)
language sql
stable
security invoker
as $$
  select
    c.id as chunk_id,
    c.document_id,
    c.chunk_index,
    c.text as chunk_text,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.title as doc_title,
    d.doc_type,
    d.source_url,
    d.practice_areas,
    d.effective_date,
    d.metadata as doc_metadata
  from public.legal_chunks c
  join public.legal_documents d on d.id = c.document_id
  where
    practice_area_filter is null
    or d.practice_areas && practice_area_filter
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

comment on function public.match_legal_chunks is
  'Top-k cosine-similarity search over legal_chunks. Optional practice_area_filter intersects with documents.practice_areas.';
