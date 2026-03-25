
-- Add type and billing_interval to credit_packages
ALTER TABLE public.credit_packages
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS billing_interval text;

-- Add subscription fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_id text;
