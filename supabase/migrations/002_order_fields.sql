-- Add dispatch date and payment status to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatch_date date;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'paid'));
