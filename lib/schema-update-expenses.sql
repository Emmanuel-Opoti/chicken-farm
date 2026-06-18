-- Run this in Supabase SQL Editor

ALTER TABLE flocks ADD COLUMN IF NOT EXISTS purchase_cost_kes numeric DEFAULT 0;

CREATE TABLE IF NOT EXISTS misc_expenses (
  id uuid default gen_random_uuid() primary key,
  expense_date date not null,
  category text not null,
  description text,
  amount_kes numeric not null default 0,
  flock_id uuid references flocks(id),
  created_at timestamptz default now()
);
