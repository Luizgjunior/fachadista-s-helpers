
CREATE OR REPLACE VIEW public.admin_monthly_mrr AS
WITH months AS (
  SELECT generate_series(
    date_trunc('month', COALESCE(
      (SELECT MIN(processed_at) FROM cakto_orders WHERE status = 'approved'),
      NOW() - INTERVAL '11 months'
    )),
    date_trunc('month', NOW()),
    '1 month'::interval
  )::date AS month_start
),
monthly_data AS (
  SELECT 
    m.month_start,
    COALESCE(SUM(
      CASE WHEN cp.type = 'subscription' THEN o.amount_paid ELSE 0 END
    ), 0) AS mrr,
    COALESCE(SUM(o.amount_paid), 0) AS total_revenue,
    COUNT(DISTINCT CASE WHEN cp.type = 'subscription' THEN o.user_id END) AS subscribers
  FROM months m
  LEFT JOIN cakto_orders o 
    ON o.status = 'approved'
    AND date_trunc('month', o.processed_at) = m.month_start
  LEFT JOIN credit_packages cp ON cp.id = o.package_id
  GROUP BY m.month_start
)
SELECT 
  month_start as month,
  mrr::numeric,
  total_revenue::numeric,
  subscribers::bigint
FROM monthly_data
ORDER BY month_start;

ALTER VIEW public.admin_monthly_mrr SET (security_invoker = true);
