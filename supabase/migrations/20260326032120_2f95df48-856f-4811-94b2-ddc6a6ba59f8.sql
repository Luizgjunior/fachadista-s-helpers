DROP POLICY "Sistema pode inserir pedidos" ON public.cakto_orders;

CREATE POLICY "Service role pode inserir pedidos"
ON public.cakto_orders
FOR INSERT
TO service_role
WITH CHECK (true);