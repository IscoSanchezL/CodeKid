-- Monedas y tienda de trajes (H3). Las monedas solo se mueven desde funciones del servidor.

create table public.shop_items (
  id text primary key,
  slot text not null check (slot in ('color', 'hat', 'glasses', 'neck')),
  name text not null,
  rarity text not null check (rarity in ('comun', 'raro', 'epico')),
  price integer not null check (price >= 0),
  sort integer not null default 0
);
alter table public.shop_items enable row level security;
create policy "tienda: ver catalogo" on public.shop_items for select to authenticated using (true);

insert into public.shop_items (id, slot, name, rarity, price, sort) values
  ('color-cyan', 'color', 'Celeste', 'comun', 0, 1),
  ('color-green', 'color', 'Menta', 'comun', 0, 2),
  ('color-purple', 'color', 'Violeta', 'comun', 40, 3),
  ('color-orange', 'color', 'Naranja', 'comun', 40, 4),
  ('color-pink', 'color', 'Chicle', 'comun', 60, 5),
  ('color-red', 'color', 'Fresa', 'comun', 60, 6),
  ('color-rainbow', 'color', 'Arcoíris', 'raro', 150, 7),
  ('color-gold', 'color', 'Dorado', 'epico', 250, 8),
  ('hat-flower', 'hat', 'Flor', 'comun', 30, 9),
  ('hat-cap', 'hat', 'Gorra', 'comun', 30, 10),
  ('hat-chef', 'hat', 'Gorro de chef', 'comun', 40, 11),
  ('hat-antenna', 'hat', 'Antenas', 'comun', 50, 12),
  ('hat-cowboy', 'hat', 'Vaquero', 'comun', 60, 13),
  ('hat-top', 'hat', 'Sombrero de copa', 'comun', 80, 14),
  ('hat-pirate', 'hat', 'Pirata', 'raro', 90, 15),
  ('hat-wizard', 'hat', 'Gorro de mago', 'raro', 100, 16),
  ('hat-astro', 'hat', 'Casco espacial', 'raro', 150, 17),
  ('hat-crown', 'hat', 'Corona', 'epico', 200, 18),
  ('gl-round', 'glasses', 'Gafas redondas', 'comun', 30, 19),
  ('gl-sun', 'glasses', 'Gafas de sol', 'comun', 50, 20),
  ('gl-heart', 'glasses', 'Corazones', 'comun', 60, 21),
  ('gl-monocle', 'glasses', 'Monóculo', 'comun', 70, 22),
  ('gl-nerd', 'glasses', 'Visor de programador', 'raro', 80, 23),
  ('gl-star', 'glasses', 'Estrellas', 'raro', 120, 24),
  ('neck-bow', 'neck', 'Corbatín', 'comun', 30, 25),
  ('neck-scarf', 'neck', 'Bufanda', 'comun', 50, 26),
  ('neck-medal', 'neck', 'Medalla', 'comun', 70, 27),
  ('neck-cape', 'neck', 'Capa de héroe', 'raro', 120, 28),
  ('neck-wings', 'neck', 'Alas', 'epico', 220, 29);

create table public.inventory (
  student_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null references public.shop_items (id),
  acquired_at timestamptz not null default now(),
  primary key (student_id, item_id)
);
alter table public.inventory enable row level security;
create policy "inventario: ver propio o de mis alumnos" on public.inventory for select
  using (student_id = auth.uid() or public.is_teacher_of(student_id) or public.is_guardian_of(student_id) or public.is_admin());

create table public.coin_ledger (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index coin_ledger_student_idx on public.coin_ledger (student_id, created_at desc);
alter table public.coin_ledger enable row level security;
create policy "monedas: ver propias o de mis alumnos" on public.coin_ledger for select
  using (student_id = auth.uid() or public.is_teacher_of(student_id) or public.is_guardian_of(student_id) or public.is_admin());

alter table public.profiles add column last_play_date date;

-- Oferta del día: un artículo de 40+ monedas con 20 % de descuento, el mismo para todos y distinto cada día.
create or replace function public.shop_deal()
returns table (item_id text, discount integer)
language sql stable security definer set search_path = public as $$
  with pool as (
    select id, row_number() over (order by sort, id) as rn, count(*) over () as n
    from shop_items where price >= 40
  )
  select id, 20 from pool
  where rn = 1 + ((extract(doy from (now() at time zone 'utc'))::int * 7) % n)
  limit 1;
$$;

create or replace function public.item_price(p_item text)
returns integer
language sql stable security definer set search_path = public as $$
  select case when d.item_id is not null then (i.price * (100 - d.discount)) / 100 else i.price end
  from shop_items i left join shop_deal() d on d.item_id = i.id
  where i.id = p_item;
$$;

create or replace function public.buy_item(p_item text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_price integer;
  bal integer;
begin
  if uid is null then raise exception 'Inicia sesión para comprar' using errcode = '28000'; end if;
  v_price := public.item_price(p_item);
  if v_price is null then raise exception 'Artículo no encontrado' using errcode = 'P0002'; end if;
  if v_price = 0 or exists (select 1 from inventory where student_id = uid and item_id = p_item) then
    raise exception 'Ya es tuyo' using errcode = '23505';
  end if;
  select coins into bal from profiles where id = uid for update;
  if bal is null then raise exception 'Perfil no encontrado' using errcode = 'P0002'; end if;
  if bal < v_price then raise exception 'Te faltan % monedas', v_price - bal using errcode = 'P0001'; end if;
  update profiles set coins = coins - v_price where id = uid;
  insert into inventory (student_id, item_id) values (uid, p_item);
  insert into coin_ledger (student_id, delta, reason) values (uid, -v_price, 'compra:' || p_item);
  return jsonb_build_object('balance', bal - v_price, 'price', v_price, 'item', p_item);
end $$;

create or replace function public.equip_item(p_slot text, p_item text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  k text;
  it record;
  result jsonb;
begin
  if uid is null then raise exception 'Inicia sesión' using errcode = '28000'; end if;
  k := case p_slot when 'color' then 'variant' when 'hat' then 'hat' when 'glasses' then 'glasses' when 'neck' then 'neck' end;
  if k is null then raise exception 'Ranura no válida' using errcode = '22023'; end if;

  if p_item is null then
    update profiles set avatar = avatar - k where id = uid returning avatar into result;
    return result;
  end if;

  select * into it from shop_items where id = p_item and slot = p_slot;
  if not found then raise exception 'Artículo no válido' using errcode = 'P0002'; end if;
  if it.price > 0 and not exists (select 1 from inventory where student_id = uid and item_id = p_item) then
    raise exception 'Todavía no lo tienes' using errcode = '42501';
  end if;

  update profiles
    set avatar = avatar || jsonb_build_object(k, case when p_slot = 'color' then substr(p_item, 7) else p_item end)
    where id = uid returning avatar into result;
  return result;
end $$;

-- Reto superado: guarda el progreso y reparte monedas. SOLO la ejecuta el servidor tras comprobar el programa.
create or replace function public.award_progress(p_student uuid, p_level integer, p_challenge integer, p_stars integer, p_blocks integer)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  prev record;
  was_first boolean;
  star_gain integer;
  earned integer := 0;
  bonus integer := 0;
  today date := (now() at time zone 'utc')::date;
  last_day date;
  streak integer;
  bal integer;
begin
  if p_stars < 1 or p_stars > 3 then raise exception 'Estrellas no válidas' using errcode = '22023'; end if;

  select * into prev from progress where student_id = p_student and level = p_level and challenge = p_challenge;
  was_first := not found;
  star_gain := greatest(p_stars - coalesce(prev.stars, 0), 0);
  earned := (case when was_first then 10 else 0 end) + star_gain * 5;

  insert into progress (student_id, level, challenge, stars, attempts, best_blocks, completed_at)
  values (p_student, p_level, p_challenge, p_stars, 1, p_blocks, now())
  on conflict (student_id, level, challenge) do update set
    stars = greatest(progress.stars, excluded.stars),
    attempts = progress.attempts + 1,
    best_blocks = least(coalesce(progress.best_blocks, excluded.best_blocks), excluded.best_blocks),
    completed_at = now();

  select last_play_date, streak_days into last_day, streak from profiles where id = p_student for update;
  if last_day is distinct from today then
    streak := case when last_day = today - 1 then coalesce(streak, 0) + 1 else 1 end;
    bonus := 5 + case when streak % 3 = 0 then 10 else 0 end;
    update profiles set last_play_date = today, streak_days = streak where id = p_student;
  end if;

  if earned > 0 then
    insert into coin_ledger (student_id, delta, reason) values (p_student, earned, 'reto:' || p_level || '-' || p_challenge);
  end if;
  if bonus > 0 then
    insert into coin_ledger (student_id, delta, reason) values (p_student, bonus, 'diario:racha ' || streak);
  end if;
  update profiles set coins = coins + earned + bonus where id = p_student returning coins into bal;

  return jsonb_build_object(
    'first', was_first, 'starsBefore', coalesce(prev.stars, 0), 'starsAfter', greatest(coalesce(prev.stars, 0), p_stars),
    'coins', earned, 'bonus', bonus, 'streak', coalesce(streak, 0), 'balance', bal
  );
end $$;

-- Permisos: los alumnos solo compran y se visten; el progreso lo escribe el servidor.
revoke execute on function public.shop_deal() from public, anon;
revoke execute on function public.item_price(text) from public, anon;
revoke execute on function public.buy_item(text) from public, anon;
revoke execute on function public.equip_item(text, text) from public, anon;
revoke execute on function public.award_progress(uuid, integer, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.shop_deal() to authenticated;
grant execute on function public.item_price(text) to authenticated;
grant execute on function public.buy_item(text) to authenticated;
grant execute on function public.equip_item(text, text) to authenticated;
grant execute on function public.award_progress(uuid, integer, integer, integer, integer) to service_role;

alter policy "progress: escribir el propio" on public.progress with check (false);
alter policy "progress: actualizar el propio" on public.progress using (false) with check (false);
