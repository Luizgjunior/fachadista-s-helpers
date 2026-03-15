ALTER TABLE public.credit_packages 
  ADD COLUMN IF NOT EXISTS is_popular boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS features jsonb;