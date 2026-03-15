
CREATE OR REPLACE VIEW public.admin_metrics AS
SELECT
  (SELECT count(*) FROM public.profiles WHERE is_admin = false)::bigint AS total_users,
  (SELECT count(*) FROM public.profiles WHERE is_admin = false AND created_at >= now() - interval '30 days')::bigint AS new_users_30d,
  (SELECT count(*) FROM public.profiles WHERE is_admin = false AND plan_id = 'pro')::bigint AS pro_users,
  (SELECT count(*) FROM public.profiles WHERE is_admin = false AND plan_id = 'free')::bigint AS free_users,
  (SELECT count(*) FROM public.prompts p INNER JOIN public.profiles pr ON p.user_id = pr.id WHERE pr.is_admin = false)::bigint AS total_prompts,
  (SELECT count(*) FROM public.prompts p INNER JOIN public.profiles pr ON p.user_id = pr.id WHERE pr.is_admin = false AND p.created_at >= now() - interval '30 days')::bigint AS prompts_30d,
  (SELECT coalesce(sum(abs(ct.amount)), 0) FROM public.credit_transactions ct INNER JOIN public.profiles pr ON ct.user_id = pr.id WHERE pr.is_admin = false AND ct.type = 'consume')::bigint AS total_credits_consumed,
  (SELECT coalesce(sum(abs(ct.amount)), 0) FROM public.credit_transactions ct INNER JOIN public.profiles pr ON ct.user_id = pr.id WHERE pr.is_admin = false AND ct.type = 'consume' AND ct.created_at >= now() - interval '30 days')::bigint AS credits_consumed_30d;
