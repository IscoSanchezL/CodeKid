-- Fase 2 · Modo avanzado: los niveles 11–20 son la versión avanzada de los planetas 1–10.
alter table public.progress drop constraint if exists progress_level_check;
alter table public.progress add constraint progress_level_check check (level between 1 and 20);

alter table public.challenge_attempts drop constraint if exists challenge_attempts_level_check;
alter table public.challenge_attempts add constraint challenge_attempts_level_check check (level between 1 and 20);

create or replace function public.log_attempt(p_level integer, p_challenge integer)
returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null or p_level not between 1 and 20 or p_challenge < 1 then return; end if;
  if not exists (select 1 from profiles where id = uid and role = 'student') then return; end if;
  insert into challenge_attempts (student_id, level, challenge, failures, last_attempt_at)
  values (uid, p_level, p_challenge, 1, now())
  on conflict (student_id, level, challenge) do update
    set failures = challenge_attempts.failures + 1, last_attempt_at = now();
end $$;
