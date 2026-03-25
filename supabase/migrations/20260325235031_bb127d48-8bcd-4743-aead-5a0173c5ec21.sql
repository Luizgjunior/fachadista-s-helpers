
-- Financial metrics view for admin dashboard
CREATE OR REPLACE VIEW public.admin_financial_metrics AS
WITH active_subs AS (
  SELECT 
    p.id,
    p.plan_id,
    p.subscription_status,
    cp.price_brl
  FROM profiles p
  LEFT JOIN credit_packages cp ON cp.id = p.plan_id AND cp.type = 'subscription'
  WHERE p.is_admin = false
),
revenue_30d AS (
  SELECT 
    COALESCE(SUM(amount_paid), 0) as total
  FROM cakto_orders 
  WHERE status = 'approved' 
    AND processed_at >= NOW() - INTERVAL '30 days'
),
revenue_all AS (
  SELECT 
    COALESCE(SUM(amount_paid), 0) as total
  FROM cakto_orders 
  WHERE status = 'approved'
),
daily_revenue AS (
  SELECT 
    DATE(processed_at) as day,
    SUM(amount_paid) as revenue
  FROM cakto_orders
  WHERE status = 'approved' AND processed_at >= NOW() - INTERVAL '30 days'
  GROUP BY DATE(processed_at)
  ORDER BY day
)
SELECT 
  (SELECT COUNT(*) FROM active_subs WHERE subscription_status = 'active')::bigint as active_subscribers,
  (SELECT COALESCE(SUM(price_brl), 0) FROM active_subs WHERE subscription_status = 'active')::numeric as mrr,
  (SELECT total FROM revenue_30d)::numeric as revenue_30d,
  (SELECT total FROM revenue_all)::numeric as revenue_total,
  (SELECT COUNT(*) FROM active_subs WHERE subscription_status = 'cancelled')::bigint as churned_users,
  (SELECT COUNT(*) FROM cakto_orders WHERE status = 'approved')::bigint as total_orders,
  (SELECT COUNT(*) FROM cakto_orders WHERE status = 'approved' AND processed_at >= NOW() - INTERVAL '30 days')::bigint as orders_30d,
  (SELECT COALESCE(AVG(amount_paid), 0) FROM cakto_orders WHERE status = 'approved')::numeric as avg_ticket;

-- Daily revenue view for chart
CREATE OR REPLACE VIEW public.admin_daily_revenue AS
SELECT 
  DATE(processed_at) as day,
  SUM(amount_paid)::numeric as revenue,
  COUNT(*)::bigint as orders
FROM cakto_orders
WHERE status = 'approved' AND processed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(processed_at)
ORDER BY day;

-- Revenue by plan view
CREATE OR REPLACE VIEW public.admin_revenue_by_plan AS
SELECT 
  COALESCE(o.package_id, 'unknown') as package_id,
  COALESCE(cp.name, o.package_id, 'Desconhecido') as package_name,
  COUNT(*)::bigint as orders,
  SUM(o.amount_paid)::numeric as revenue,
  SUM(o.credits_added)::bigint as credits_sold
FROM cakto_orders o
LEFT JOIN credit_packages cp ON cp.id = o.package_id
WHERE o.status = 'approved'
GROUP BY o.package_id, cp.name
ORDER BY revenue DESC;
