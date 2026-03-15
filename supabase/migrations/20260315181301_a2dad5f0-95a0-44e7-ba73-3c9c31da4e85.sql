UPDATE auth.users 
SET email_confirmed_at = now(), 
    updated_at = now()
WHERE email = 'alpha2022gt@gmail.com' 
  AND email_confirmed_at IS NULL;