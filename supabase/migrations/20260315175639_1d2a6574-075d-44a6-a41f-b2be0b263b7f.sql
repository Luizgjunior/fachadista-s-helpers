
-- Table: plans
CREATE TABLE public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  credits_per_month integer NOT NULL,
  price_brl decimal(10,2) NOT NULL,
  features jsonb,
  created_at timestamptz DEFAULT now()
);

INSERT INTO public.plans (id, name, credits_per_month, price_brl, features) VALUES
('free', 'Free', 10, 0.00, '["10 créditos iniciais", "Histórico de 10 prompts", "Comparador de renders"]'),
('pro', 'Pro', 200, 49.90, '["200 créditos/mês", "Histórico ilimitado", "Comparador de renders", "Preview visual IA", "Suporte prioritário"]');

-- Table: profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  plan_id text REFERENCES public.plans(id) DEFAULT 'free',
  credits integer NOT NULL DEFAULT 10,
  total_prompts_generated integer NOT NULL DEFAULT 0,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin (avoids infinite recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND is_admin = true
  )
$$;

CREATE POLICY "Usuário vê apenas seu perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin vê todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Usuário atualiza apenas seu perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin atualiza qualquer perfil"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Table: prompts
CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prompt_english text NOT NULL,
  prompt_portuguese text,
  tags text[],
  parameters jsonb,
  preview_url text,
  credits_used integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas seus prompts"
  ON public.prompts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário insere seus prompts"
  ON public.prompts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin vê todos os prompts"
  ON public.prompts FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Table: credit_transactions
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('consume', 'recharge', 'bonus', 'purchase')),
  description text,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê suas transações"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin vê todas as transações"
  ON public.credit_transactions FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Trigger: criar perfil automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Função: consumir crédito (atômica e segura)
CREATE OR REPLACE FUNCTION public.consume_credit(
  p_user_id uuid,
  p_description text DEFAULT 'Geração de prompt'
)
RETURNS boolean AS $$
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
  SET
    credits = credits - 1,
    total_prompts_generated = total_prompts_generated + 1,
    updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -1, 'consume', p_description);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View: métricas para o admin
CREATE OR REPLACE VIEW public.admin_metrics AS
SELECT
  (SELECT count(*) FROM public.profiles) AS total_users,
  (SELECT count(*) FROM public.profiles WHERE is_admin = false AND created_at >= now() - interval '30 days') AS new_users_30d,
  (SELECT count(*) FROM public.profiles WHERE plan_id = 'pro') AS pro_users,
  (SELECT count(*) FROM public.profiles WHERE plan_id = 'free') AS free_users,
  (SELECT count(*) FROM public.prompts) AS total_prompts,
  (SELECT count(*) FROM public.prompts WHERE created_at >= now() - interval '30 days') AS prompts_30d,
  (SELECT coalesce(sum(abs(amount)), 0) FROM public.credit_transactions WHERE type = 'consume') AS total_credits_consumed,
  (SELECT coalesce(sum(abs(amount)), 0) FROM public.credit_transactions WHERE type = 'consume' AND created_at >= now() - interval '30 days') AS credits_consumed_30d;
