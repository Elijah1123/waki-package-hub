-- ROLES
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "admins read roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));

create or replace function public.claim_admin()
returns boolean language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null then return false; end if;
  if lower(v_email) = 'admin54@gmail.com' then
    insert into public.user_roles (user_id, role) values (auth.uid(),'admin')
    on conflict (user_id, role) do nothing;
    return true;
  end if;
  return false;
end; $$;
grant execute on function public.claim_admin() to authenticated;

-- PROFILES
create table public.profiles (
  id uuid primary key,
  full_name text,
  phone text,
  avatar_url text,
  delivery_address text,
  shipping_zone_id uuid,
  accepted_terms boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "admin read profiles" on public.profiles for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- SHIPPING ZONES
create table public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  area_name text not null unique,
  fee_ksh integer not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.shipping_zones to authenticated;
grant select on public.shipping_zones to anon;
grant all on public.shipping_zones to service_role;
alter table public.shipping_zones enable row level security;
create policy "public read zones" on public.shipping_zones for select to anon, authenticated using (true);
create policy "admin manage zones" on public.shipping_zones for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.shipping_zones (area_name, fee_ksh) values
  ('Kiria-ini Town', 0),
  ('Kangema', 150),
  ('Murang''a Town', 250),
  ('Nyeri', 300),
  ('Nairobi', 400),
  ('Other counties', 550);

-- PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_ksh integer not null,
  unit text not null default 'each',
  image_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.products to authenticated;
grant select on public.products to anon;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "public read products" on public.products for select to anon, authenticated using (true);
create policy "admin manage products" on public.products for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.products (name, description, price_ksh, unit, image_key) values
  ('Brown Packaging Bags','Strong kraft paper bags for shops, groceries and takeaways.',100,'per kg','brown-bags'),
  ('Gift Bags','Colourful, sturdy gift bags for celebrations and retail.',70,'each','gift-bags'),
  ('Branded Book Covers (A4)','Durable A4 book covers, branded to your school or business.',20,'each','book-covers'),
  ('Charcoal Briquettes','Clean-burning, long-lasting eco briquettes.',150,'per pack','briquettes'),
  ('Cake Boxes','Food-safe cake boxes that keep cakes neat in transit.',200,'each','cake-boxes'),
  ('Envelopes','Quality envelopes for office and personal use.',100,'each','envelopes'),
  ('Popcorn Bags','Grease-resistant popcorn bags for snack vendors.',80,'each','popcorn-bags');

-- CART
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);
grant select, insert, update, delete on public.cart_items to authenticated;
grant all on public.cart_items to service_role;
alter table public.cart_items enable row level security;
create policy "own cart" on public.cart_items for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ORDERS
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  subtotal_ksh integer not null,
  shipping_ksh integer not null default 0,
  total_ksh integer not null,
  delivery_address text not null,
  shipping_area text,
  phone text,
  status text not null default 'Pending' check (status in ('Pending','Shipped','Delivered','Cancelled')),
  payment_status text not null default 'Awaiting payment' check (payment_status in ('Awaiting payment','Paid','Failed')),
  mpesa_reference text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "own orders select" on public.orders for select to authenticated using (auth.uid() = user_id);
create policy "own orders insert" on public.orders for insert to authenticated with check (auth.uid() = user_id);
create policy "own orders update" on public.orders for update to authenticated using (auth.uid() = user_id);
create policy "admin all orders" on public.orders for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  product_name text not null,
  unit_price_ksh integer not null,
  quantity integer not null check (quantity > 0)
);
grant select, insert on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "own order items select" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "own order items insert" on public.order_items for insert to authenticated
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "admin order items" on public.order_items for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- CONTACT MESSAGES
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon, authenticated;
grant select on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "anyone can send message" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "admin read messages" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(),'admin'));
