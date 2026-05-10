-- Billing goals: global and per-client targets
CREATE TABLE billing_goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,  -- NULL = objetivo global
  target_usd numeric(10,2) not null default 0,
  label text,
  created_at timestamptz default now(),
  unique(client_id)
);
