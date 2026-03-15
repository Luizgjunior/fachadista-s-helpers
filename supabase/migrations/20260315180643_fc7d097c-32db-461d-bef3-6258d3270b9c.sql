
-- Function: recharge all pro users
CREATE OR REPLACE FUNCTION public.recharge_pro_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.profiles
  SET credits = credits + 200, updated_at = now()
  WHERE plan_id = 'pro';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  SELECT id, 200, 'recharge', 'Recarga mensal Pro'
  FROM public.profiles
  WHERE plan_id = 'pro';

  RETURN updated_count;
END;
$$;

-- Function: toggle admin status
CREATE OR REPLACE FUNCTION public.toggle_admin(target_user_id uuid, make_admin boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET is_admin = make_admin, updated_at = now()
  WHERE id = target_user_id;
  RETURN true;
END;
$$;

-- Admin needs to insert credit_transactions when adjusting credits
CREATE POLICY "Admin insere transações"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()));
