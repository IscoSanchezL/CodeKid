-- CodeKid — esquema inicial (H1): perfiles, aulas, progreso. RLS activado en todo.

create type public.user_role as enum ('student', 'teacher', 'guardian', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'student',
  display_name text not null check (char_length(display_name) between 2 and 40),
  avatar jsonb not null default '{}'::jsonb,
  coins integer not null default 0 check (coins >= 0),
  streak_days integer not null default 0 check (streak_days >= 0),
  created_at timestamptz not null default now()
);

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  join_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table public.classroom_members (
  classroom_id uuid not null references public.classrooms (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (classroom_id, student_id)
);

-- Vínculo tutor <-> estudiante (consentimiento parental)
create table public.guardianships (
  guardian_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  primary key (guardian_id, student_id)
);

-- Progreso por reto. Los retos viven como JSON en el código (level, challenge).
create table public.progress (
  student_id uuid not null references public.profiles (id) on delete cascade,
  level integer not null check (level between 1 and 10),
  challenge integer not null check (challenge >= 1),
  stars smallint not null default 0 check (stars between 0 and 3),
  attempts integer not null default 0,
  best_blocks integer,
  completed_at timestamptz,
  primary key (student_id, level, challenge)
);

-- Helpers (security definer para evitar recursión de RLS)
create or replace function public.is_teacher_of(student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from classroom_members m
    join classrooms c on c.id = m.classroom_id
    where m.student_id = student and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_guardian_of(student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from guardianships g where g.student_id = student and g.guardian_id = auth.uid()
  );
$$;

-- Alta automática del perfil al registrarse. El rol 'admin' NUNCA se acepta desde el cliente.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'student');
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    case when requested in ('teacher', 'guardian') then requested::public.user_role else 'student' end,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'Explorador')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;
alter table public.guardianships enable row level security;
alter table public.progress enable row level security;

-- profiles
create policy "profiles: ver el propio, de mis alumnos o de mis tutelados" on public.profiles
  for select using (id = auth.uid() or public.is_teacher_of(id) or public.is_guardian_of(id));
-- El cliente solo puede cambiar nombre y avatar; role/coins/streak los fija el servidor.
create policy "profiles: editar el propio" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (display_name, avatar) on public.profiles to authenticated;

-- classrooms
create policy "classrooms: docente dueño" on public.classrooms
  for all using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "classrooms: miembros las ven" on public.classrooms
  for select using (exists (
    select 1 from public.classroom_members m
    where m.classroom_id = id and m.student_id = auth.uid()
  ));

-- classroom_members
create policy "members: ver propia pertenencia o aula propia" on public.classroom_members
  for select using (
    student_id = auth.uid()
    or exists (select 1 from public.classrooms c where c.id = classroom_id and c.teacher_id = auth.uid())
  );
create policy "members: unirse uno mismo" on public.classroom_members
  for insert with check (student_id = auth.uid());
create policy "members: salir" on public.classroom_members
  for delete using (student_id = auth.uid());

-- guardianships
create policy "guardianships: ver propias" on public.guardianships
  for select using (guardian_id = auth.uid() or student_id = auth.uid());

-- progress
create policy "progress: ver propio, de mis alumnos o tutelados" on public.progress
  for select using (student_id = auth.uid() or public.is_teacher_of(student_id) or public.is_guardian_of(student_id));
create policy "progress: escribir el propio" on public.progress
  for insert with check (student_id = auth.uid());
create policy "progress: actualizar el propio" on public.progress
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());
