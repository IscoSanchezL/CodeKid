-- Super administrador por correo. El rol 'admin' solo se concede en el servidor y
-- SOLO si el correo está verificado (email_confirmed_at no nulo). Nunca desde el cliente.

create table public.admin_emails (
  email text primary key check (email = lower(email))
);
alter table public.admin_emails enable row level security; -- sin políticas: solo el servidor la lee
revoke all on public.admin_emails from anon, authenticated;

insert into public.admin_emails (email) values ('franksanlo@gmail.com');

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- El alta de perfil ahora decide también el rol admin (correo en lista y verificado).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'student');
  is_super boolean := new.email_confirmed_at is not null
    and exists (select 1 from public.admin_emails where email = lower(new.email));
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    case
      when is_super then 'admin'::public.user_role
      when requested in ('teacher', 'guardian') then requested::public.user_role
      else 'student'::public.user_role
    end,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Explorador')
  );
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Si el correo se verifica después del registro, se promueve en ese momento.
create or replace function public.promote_super_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null
     and exists (select 1 from public.admin_emails where email = lower(new.email)) then
    update public.profiles set role = 'admin' where id = new.id and role <> 'admin';
  end if;
  return new;
end $$;
revoke execute on function public.promote_super_admin() from public, anon, authenticated;

create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute function public.promote_super_admin();

-- El administrador puede leer todo (no escribe desde el cliente).
create policy "admin: leer perfiles" on public.profiles for select using (public.is_admin());
create policy "admin: leer aulas" on public.classrooms for select using (public.is_admin());
create policy "admin: leer miembros" on public.classroom_members for select using (public.is_admin());
create policy "admin: leer tutelas" on public.guardianships for select using (public.is_admin());
create policy "admin: leer progreso" on public.progress for select using (public.is_admin());
