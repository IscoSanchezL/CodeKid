-- Acceso por clase (estilo Kodable). Aplicada por pasos en el proyecto: el panel de la
-- herramienta se colgaba con DROP POLICY (pide confirmación), por eso se neutraliza con ALTER.

create table public.student_credentials (
  student_id uuid primary key references public.profiles (id) on delete cascade,
  login_email text not null unique,
  pin_hash text,
  failed_count integer not null default 0,
  locked_until timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.student_credentials enable row level security; -- sin políticas: solo servidor
revoke all on public.student_credentials from anon, authenticated;

-- Códigos de clase fáciles de dictar: sin 0/O, 1/I/L
create or replace function public.gen_join_code()
returns text language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.classrooms where join_code = code);
  end loop;
  return code;
end $$;
revoke execute on function public.gen_join_code() from public, anon;
grant execute on function public.gen_join_code() to authenticated;

alter table public.classrooms alter column join_code set default public.gen_join_code();

-- Los alumnos ya no se unen solos con el id de la clase: los añade el docente desde el servidor.
alter policy "members: unirse uno mismo" on public.classroom_members with check (false);
