
-- Fix 1: Enable RLS on plans table (public read-only)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans são públicos para leitura" ON public.plans FOR SELECT USING (true);

-- Fix 2: Drop security definer view and recreate as regular view with invoker security
DROP VIEW IF EXISTS public.admin_metrics;
CREATE VIEW public.admin_metrics WITH (security_invoker = true) AS
SELECT
  (SELECT count(*) FROM public.profiles) AS total_users,
  (SELECT count(*) FROM public.profiles WHERE is_admin = false AND created_at >= now() - interval '30 days') AS new_users_30d,
  (SELECT count(*) FROM public.profiles WHERE plan_id = 'pro') AS pro_users,
  (SELECT count(*) FROM public.profiles WHERE plan_id = 'free') AS free_users,
  (SELECT count(*) FROM public.prompts) AS total_prompts,
  (SELECT count(*) FROM public.prompts WHERE created_at >= now() - interval '30 days') AS prompts_30d,
  (SELECT coalesce(sum(abs(amount)), 0) FROM public.credit_transactions WHERE type = 'consume') AS total_credits_consumed,
  (SELECT coalesce(sum(abs(amount)), 0) FROM public.credit_transactions WHERE type = 'consume' AND created_at >= now() - interval '30 days') AS credits_consumed_30d;

-- Fix 3: Set search_path on handle_new_user and consume_credit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan_id, credits, is_admin)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'free',
    10,
    false
  );
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (new.id, 10, 'bonus', 'Créditos de boas-vindas');
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_credit(
  p_user_id uuid,
  p_description text DEFAULT 'Geração de prompt'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits integer;
BEGIN
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;
  IF current_credits <= 0 THEN
    RETURN false;
  END IF;
  UPDATE public.profiles
  SET credits = credits - 1, total_prompts_generated = total_prompts_generated + 1, updated_at = now()
  WHERE id = p_user_id;
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -1, 'consume', p_description);
  RETURN true;
END;
$$;
