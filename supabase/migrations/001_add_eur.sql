-- Add EUR currency support
-- Run this in the Supabase SQL Editor

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_currency_check;
ALTER TABLE clients ADD CONSTRAINT clients_currency_check
  CHECK (currency IN ('USD', 'ARS', 'EUR'));

ALTER TABLE client_prices ADD COLUMN IF NOT EXISTS price_eur numeric(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_eur numeric(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price_eur numeric(10,2);
