
-- Step 2: Ensure plan_id allows null
ALTER TABLE public.profiles ALTER COLUMN plan_id DROP NOT NULL;

-- Step 5: Update admin RLS policies
-- Drop existing admin update policy and recreate with broader scope
DROP POLICY IF EXISTS "Admin atualiza qualquer perfil" ON public.profiles;

CREATE POLICY "Admin atualiza qualquer perfil"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Add admin delete policy for profiles (completeness)
CREATE POLICY "Admin deleta qualquer perfil"
  ON public.profiles FOR DELETE
  USING (public.is_admin(auth.uid()));
