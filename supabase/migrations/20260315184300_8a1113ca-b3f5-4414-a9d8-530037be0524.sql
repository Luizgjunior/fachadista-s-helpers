
-- Credit packages table
create table public.credit_packages (
  id text primary key,
  name text not null,
  credits integer not null,
  price_brl decimal(10,2) not null,
  cakto_checkout_url text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.credit_packages enable row level security;

create policy "Pacotes são públicos para leitura"
  on public.credit_packages for select
  using (true);

-- Cakto orders table
create table public.cakto_orders (
  id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  package_id text references public.credit_packages(id),
  credits_added integer not null,
  amount_paid decimal(10,2),
  customer_email text,
  status text not null default 'approved',
  processed_at timestamptz default now()
);

alter table public.cakto_orders enable row level security;

create policy "Admin vê todos os pedidos Cakto"
  on public.cakto_orders for select
  using (public.is_admin(auth.uid()));

create policy "Sistema pode inserir pedidos"
  on public.cakto_orders for insert
  with check (true);
