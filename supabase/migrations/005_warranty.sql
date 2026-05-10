CREATE TABLE IF NOT EXISTS warranty_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  country text NOT NULL,
  channel text NOT NULL,
  store_name text,
  purchase_date date NOT NULL,
  warranty_expires date NOT NULL
);

CREATE TABLE IF NOT EXISTS warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  registration_id uuid REFERENCES warranty_registrations(id) NOT NULL,
  issue_type text NOT NULL,
  description text NOT NULL,
  photos text[] DEFAULT '{}',
  status text DEFAULT 'pending',
  internal_notes text,
  reviewed_at timestamptz
);

CREATE TABLE IF NOT EXISTS warranty_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  claim_id uuid REFERENCES warranty_claims(id) NOT NULL,
  client_id uuid REFERENCES clients(id),
  units integer DEFAULT 1,
  status text DEFAULT 'available',
  applied_to_order uuid REFERENCES orders(id),
  applied_at timestamptz
);
