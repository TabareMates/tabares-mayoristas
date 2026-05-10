-- ==========================================
-- Tabaré Mayoristas — Database Schema
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Clients table (one row per wholesale client)
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  company text,
  country text not null,
  currency text not null default 'USD' check (currency in ('USD', 'ARS')),
  is_admin boolean not null default false,
  notes text,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Products table
create table products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  image_url text,
  weight_kg numeric(6,3),
  unit text not null default 'unidad',  -- unidad, caja, pack, etc.
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Per-client pricing
create table client_prices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  price_usd numeric(10,2),
  price_ars numeric(12,2),
  unique(client_id, product_id)
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'in_progress', 'shipped', 'delivered', 'cancelled')),
  shipping_cost_estimate numeric(10,2),
  comments text,
  admin_notes text,
  total_usd numeric(10,2),
  total_ars numeric(12,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Order items (snapshot of price at time of order)
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  product_code text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_usd numeric(10,2),
  unit_price_ars numeric(12,2)
);

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

alter table clients enable row level security;
alter table products enable row level security;
alter table client_prices enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Clients: each user sees only their own row (admins see all)
create policy "clients_select" on clients
  for select using (
    user_id = auth.uid()
    or exists (select 1 from clients where user_id = auth.uid() and is_admin = true)
  );

create policy "clients_update_admin" on clients
  for update using (
    exists (select 1 from clients where user_id = auth.uid() and is_admin = true)
  );

create policy "clients_insert_admin" on clients
  for insert with check (
    exists (select 1 from clients where user_id = auth.uid() and is_admin = true)
  );

-- Products: all authenticated users can read active products
create policy "products_select" on products
  for select using (auth.uid() is not null);

create policy "products_admin" on products
  for all using (
    exists (select 1 from clients where user_id = auth.uid() and is_admin = true)
  );

-- Client prices: each client sees only their own prices
create policy "client_prices_select" on client_prices
  for select using (
    exists (select 1 from clients where id = client_prices.client_id and user_id = auth.uid())
    or exists (select 1 from clients where user_id = auth.uid() and is_admin = true)
  );

create policy "client_prices_admin" on client_prices
  for all using (
    exists (select 1 from clients where user_id = auth.uid() and is_admin = true)
  );

-- Orders: clients see their own, admins see all
create policy "orders_select" on orders
  for select using (
    exists (select 1 from clients where id = orders.client_id and user_id = auth.uid())
    or exists (select 1 from clients where user_id = auth.uid() and is_admin = true)
  );

create policy "orders_insert" on orders
  for insert with check (
    exists (select 1 from clients where id = orders.client_id and user_id = auth.uid())
  );

create policy "orders_update_admin" on orders
  for update using (
    exists (select 1 from clients where user_id = auth.uid() and is_admin = true)
  );

-- Order items
create policy "order_items_select" on order_items
  for select using (
    exists (
      select 1 from orders o
      join clients c on c.id = o.client_id
      where o.id = order_items.order_id
      and (c.user_id = auth.uid() or exists (select 1 from clients where user_id = auth.uid() and is_admin = true))
    )
  );

create policy "order_items_insert" on order_items
  for insert with check (
    exists (
      select 1 from orders o
      join clients c on c.id = o.client_id
      where o.id = order_items.order_id
      and c.user_id = auth.uid()
    )
  );

-- ==========================================
-- Trigger: update orders.updated_at
-- ==========================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ==========================================
-- Sample data (optional — delete after testing)
-- ==========================================

-- insert into products (code, name, description, weight_kg, unit) values
--   ('MAT-001', 'Mate Tradicional Calabaza', 'Mate de calabaza natural curado, ideal para cebar', 0.15, 'unidad'),
--   ('MAT-002', 'Mate Algarrobo Premium', 'Mate tallado en madera de algarrobo', 0.20, 'unidad'),
--   ('BOT-001', 'Bombilla Alpaca Clásica', 'Bombilla de alpaca con filtro espiral', 0.08, 'unidad'),
--   ('YER-001', 'Yerba Tabaré 500g', 'Yerba mate seleccionada, corte fino', 0.55, 'pack'),
--   ('KIT-001', 'Kit Iniciador Tabaré', 'Mate + Bombilla + Yerba 500g', 0.80, 'kit');
