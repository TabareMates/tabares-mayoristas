ALTER TABLE warranty_registrations ADD COLUMN IF NOT EXISTS product_description text;
ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS product_description text;
ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS photo_1 text;
ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS photo_2 text;
ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS photo_3 text;
