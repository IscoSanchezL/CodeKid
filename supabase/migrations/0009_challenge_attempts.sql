-- Intentos fallidos por reto, para que el docente vea quién se atasca.
create table public.challenge_attempts (
  student_id uuid not null references public.profiles (id) on delete cascade,
  level integer not null check (level between 1 and 10),
  challenge integer not null check (challenge >= 1),
  failures integer not null default 0 check (failures >= 0),
  last_attempt_at timestamptz not null default now(),
  primary key (student_id, level, challenge)
);
alter table public.challenge_attempts enable row level security;
create policy "intentos: ver propios o de mis alumnos" on public.challenge_attempts for select
  using (student_id = auth.uid() or public.is_teacher_of(student_id) or public.is_guardian_of(student_id) or public.is_admin());

-- El alumno anota un intento fallido de un reto (solo suma uno a su propio contador).
create or replace function public.log_attempt(p_level integer, p_challenge integer)
returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null or p_level not between 1 and 10 or p_challenge < 1 then return; end if;
  if not exists (select 1 from profiles where id = uid and role = 'student') then return; end if;
  insert into challenge_attempts (student_id, level, challenge, failures, last_attempt_at)
  values (uid, p_level, p_challenge, 1, now())
  on conflict (student_id, level, challenge) do update
    set failures = challenge_attempts.failures + 1, last_attempt_at = now();
end $$;

revoke execute on function public.log_attempt(integer, integer) from public, anon;
grant execute on function public.log_attempt(integer, integer) to authenticated;
