CREATE OR REPLACE FUNCTION public.consume_credits_bulk(
  p_user_id uuid,
  p_amount integer,
  p_description text default 'Consumo de créditos'
)
RETURNS boolean AS $$
DECLARE
  current_credits integer;
BEGIN
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_credits < p_amount THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET
    credits = credits - p_amount,
    updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions
    (user_id, amount, type, description)
  VALUES
    (p_user_id, -p_amount, 'consume', p_description);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;