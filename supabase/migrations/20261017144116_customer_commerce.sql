-- Customer reads are owner-scoped. Only trusted server routes may write.
create table public.commerce_customers (
  user_id uuid primary key references auth.users(id) on delete restrict,
  email text not null,
  discount_override integer check (discount_override between 0 and 100),
  updated_by text,
  updated_at timestamptz not null default now()
);

create table public.commerce_orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_id uuid not null references auth.users(id) on delete restrict,
  customer_email text not null,
  status text not null default 'pending_confirmation'
    check (status in ('pending_confirmation', 'confirmed', 'processing', 'completed', 'cancelled')),
  idempotency_key text not null check (idempotency_key ~ '^[a-zA-Z0-9_-]{16,128}$'),
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  contact jsonb not null check (jsonb_typeof(contact) = 'object'),
  note text not null default '' check (length(note) <= 2000),
  quote jsonb not null check (jsonb_typeof(quote) = 'object'),
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed', 'not_configured')),
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, idempotency_key)
);
create index commerce_orders_customer_created on public.commerce_orders(customer_id, created_at desc);

create table public.commerce_order_items (
  order_id uuid not null references public.commerce_orders(id) on delete cascade,
  position integer not null check (position between 0 and 49),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  primary key (order_id, position),
  check (coalesce(jsonb_typeof(snapshot->'quantity') = 'number' and
    (snapshot->>'quantity')::numeric > 0 and (snapshot->>'quantity')::numeric <= 100000, false))
);

alter table public.commerce_customers enable row level security;
alter table public.commerce_orders enable row level security;
alter table public.commerce_order_items enable row level security;
revoke all on public.commerce_customers, public.commerce_orders, public.commerce_order_items from public, anon, authenticated;
-- Column grants keep staff identity (updated_by) and replay internals (idempotency_key, request_hash) server-only.
grant select (user_id, email, discount_override, updated_at) on public.commerce_customers to authenticated;
grant select (id, order_number, customer_id, customer_email, status, contact, note, quote, email_status, created_at, updated_at)
  on public.commerce_orders to authenticated;
grant select on public.commerce_order_items to authenticated;
grant all on public.commerce_customers, public.commerce_orders, public.commerce_order_items to service_role;
grant usage, select on sequence public.commerce_orders_order_number_seq to service_role;

create policy commerce_customer_own_read on public.commerce_customers for select to authenticated
  using ((select auth.uid()) = user_id);
create policy commerce_order_own_read on public.commerce_orders for select to authenticated
  using ((select auth.uid()) = customer_id);
create policy commerce_item_own_read on public.commerce_order_items for select to authenticated
  using (exists (select 1 from public.commerce_orders o where o.id = order_id and o.customer_id = (select auth.uid())));
create policy commerce_customer_service on public.commerce_customers for all to service_role using (true) with check (true);
create policy commerce_order_service on public.commerce_orders for all to service_role using (true) with check (true);
create policy commerce_item_service on public.commerce_order_items for all to service_role using (true) with check (true);

-- Existing ops installations already have this table; no identity is auto-promoted.
create table if not exists public.ops_role_bindings (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('agent', 'user')),
  actor_id text not null,
  role text not null check (role in ('editor', 'reviewer', 'publisher')),
  is_active boolean not null default true,
  created_by text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (actor_type, actor_id, role)
);
alter table public.ops_role_bindings enable row level security;
revoke all on public.ops_role_bindings from public, anon, authenticated;
grant all on public.ops_role_bindings to service_role;
create policy commerce_ops_service on public.ops_role_bindings for all to service_role using (true) with check (true);

create function public.commerce_create_order(
  p_customer_id uuid, p_customer_email text, p_idempotency_key text, p_request_hash text,
  p_contact jsonb, p_note text, p_quote jsonb
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  saved public.commerce_orders%rowtype;
  is_new boolean := false;
  line jsonb;
  line_index integer := 0;
  amount_sum numeric := 0;
begin
  -- Serialize retries of the same customer/key before checking the immutable request hash.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_customer_id::text || ':' || p_idempotency_key, 0));
  select * into saved from public.commerce_orders
    where customer_id = p_customer_id and idempotency_key = p_idempotency_key;
  if found then
    if saved.request_hash <> p_request_hash then raise exception 'COMMERCE_IDEMPOTENCY_CONFLICT'; end if;
  else
    -- The service-only caller verifies email using Supabase auth.getUser(token).
    if coalesce(jsonb_typeof(p_quote->'lines') <> 'array', true) then raise exception 'COMMERCE_INVALID_QUOTE'; end if;
    if jsonb_array_length(p_quote->'lines') not between 1 and 50
      or coalesce(p_quote->>'currency' <> 'RSD', true)
      or coalesce(p_quote->>'requiresConfirmation' <> 'true', true)
      or coalesce((p_quote->>'discountPercent')::integer not between 0 and 100, true)
      or coalesce((p_quote->>'quoteKey') !~ '^[0-9a-f]{64}$', true) then
      raise exception 'COMMERCE_INVALID_QUOTE';
    end if;
    insert into public.commerce_customers (user_id, email) values (p_customer_id, p_customer_email)
      on conflict (user_id) do update set email = excluded.email;
    insert into public.commerce_orders (customer_id, customer_email, idempotency_key, request_hash, contact, note, quote)
      values (p_customer_id, p_customer_email, p_idempotency_key, p_request_hash, p_contact, p_note, p_quote - 'lines')
      returning * into saved;
    for line in select value from jsonb_array_elements(p_quote->'lines') loop
      if line->>'lineTotalMinor' is not null then
        if (line->>'lineTotalMinor')::numeric < 0 or (line->>'lineTotalMinor')::numeric <> trunc((line->>'lineTotalMinor')::numeric) then
          raise exception 'COMMERCE_INVALID_AMOUNT';
        end if;
        amount_sum := amount_sum + (line->>'lineTotalMinor')::numeric;
      end if;
      insert into public.commerce_order_items(order_id, position, snapshot) values (saved.id, line_index, line);
      line_index := line_index + 1;
    end loop;
    if coalesce(amount_sum <> (p_quote->>'knownTotalMinor')::numeric, true) then raise exception 'COMMERCE_INVALID_TOTAL'; end if;
    is_new := true;
  end if;
  return jsonb_build_object('created', is_new, 'order', to_jsonb(saved) || jsonb_build_object('commerce_order_items',
    (select coalesce(jsonb_agg(jsonb_build_object('position', position, 'snapshot', snapshot) order by position), '[]'::jsonb)
     from public.commerce_order_items where order_id = saved.id)));
end;
$$;
revoke all on function public.commerce_create_order(uuid, text, text, text, jsonb, text, jsonb) from public, anon, authenticated;
grant execute on function public.commerce_create_order(uuid, text, text, text, jsonb, text, jsonb) to service_role;
