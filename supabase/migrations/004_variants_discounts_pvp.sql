-- Precios base y PVP en products
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price_usd numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price_ars numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price_eur numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pvp_ars numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pvp_eur numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pvp_usd numeric(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS category text DEFAULT 'extras';

-- Descuentos por cliente y segmento
CREATE TABLE IF NOT EXISTS client_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, category)
);

-- Variantes de producto
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  color text,
  size text,
  label text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Variante en order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_label text;
