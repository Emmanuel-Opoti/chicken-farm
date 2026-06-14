-- ============================================================
-- CHICKEN FARM MANAGEMENT SCHEMA
-- Run this in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- FLOCK REGISTRY
create table if not exists flocks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  breed text not null default 'Kenchic Layer',
  date_received date not null,
  initial_count integer not null,
  current_count integer not null,
  active boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- INPUTS REGISTRY (feeds, medicines, vaccines)
create table if not exists inputs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('feed','vaccine','medicine','other')),
  unit text not null default 'kg',
  price_kes numeric not null,
  last_price_update date not null default current_date,
  created_at timestamptz default now()
);

-- PRICE REVIEW LOG
create table if not exists price_reviews (
  id uuid primary key default gen_random_uuid(),
  input_id uuid references inputs(id) on delete cascade,
  old_price numeric not null,
  new_price numeric not null,
  reviewed_at timestamptz default now()
);

-- DAILY FEED LOG
create table if not exists feed_logs (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid references flocks(id) on delete cascade,
  input_id uuid references inputs(id),
  log_date date not null,
  quantity_kg numeric not null,
  cost_kes numeric not null,
  notes text,
  created_at timestamptz default now()
);

-- DAILY EGG LOG
create table if not exists egg_logs (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid references flocks(id) on delete cascade,
  log_date date not null,
  total_eggs integer not null,
  trays integer generated always as (floor(total_eggs / 12)) stored,
  loose_eggs integer generated always as (total_eggs % 12) stored,
  broken_eggs integer default 0,
  notes text,
  created_at timestamptz default now()
);

-- WATER LOG
create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid references flocks(id) on delete cascade,
  log_date date not null,
  litres numeric not null,
  created_at timestamptz default now()
);

-- VACCINATION LOG
create table if not exists vaccination_logs (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid references flocks(id) on delete cascade,
  input_id uuid references inputs(id),
  scheduled_date date not null,
  administered_date date,
  vaccine_name text not null,
  method text not null,
  dose_count integer,
  cost_kes numeric,
  notes text,
  created_at timestamptz default now()
);

-- CLIENTS
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  location text,
  delivery_cost_kes numeric default 0,
  active boolean default true,
  created_at timestamptz default now()
);

-- CLIENT DELIVERIES / SALES
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  sale_date date not null,
  eggs_sold integer not null,
  price_per_egg_kes numeric not null,
  delivery_cost_kes numeric default 0,
  amount_kes numeric not null,
  paid boolean default false,
  payment_date date,
  notes text,
  created_at timestamptz default now()
);

-- AD-HOC SMALL SALES (below a tray, no client)
create table if not exists adhoc_sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null,
  eggs_sold integer not null,
  price_per_egg_kes numeric not null,
  amount_kes numeric not null,
  notes text,
  created_at timestamptz default now()
);

-- MORTALITY LOG
create table if not exists mortality_logs (
  id uuid primary key default gen_random_uuid(),
  flock_id uuid references flocks(id) on delete cascade,
  log_date date not null,
  count integer not null,
  cause_type text default 'sickness',
  cause text,
  created_at timestamptz default now()
);

-- If the table already exists, add the column:
-- ALTER TABLE mortality_logs ADD COLUMN IF NOT EXISTS cause_type text DEFAULT 'sickness';

-- ============================================================
-- SEED DEFAULT INPUTS
-- ============================================================

insert into inputs (name, category, unit, price_kes, last_price_update) values
  ('Chick Mash',   'feed',    '50kg bag', 3900, current_date),
  ('Grower Mash',  'feed',    '50kg bag', 3950, current_date),
  ('Layer Mash',   'feed',    '50kg bag', 3900, current_date),
  ('Newcastle (Lasota) 500 dose', 'vaccine', 'vial', 850,  current_date),
  ('Gumboro (IBD) 500 dose',      'vaccine', 'vial', 750,  current_date),
  ('Fowl Typhoid 300 dose',       'vaccine', 'vial', 1200, current_date)
on conflict do nothing;
