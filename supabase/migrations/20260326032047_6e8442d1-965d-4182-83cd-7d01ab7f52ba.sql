CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan_id, credits, is_admin)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'free',
    30,
    false
  );
  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (new.id, 30, 'bonus', 'Créditos de boas-vindas');
  RETURN new;
END;
$function$;

ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 30;