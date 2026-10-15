-- Corrige "infinite recursion detected in policy for relation classrooms":
-- classrooms consultaba classroom_members y esta consultaba classrooms.
-- Se rompe el ciclo con funciones SECURITY DEFINER que no pasan por RLS.

create or replace function public.is_member_of(classroom uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from classroom_members where classroom_id = classroom and student_id = auth.uid());
$$;

create or replace function public.owns_classroom(classroom uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from classrooms where id = classroom and teacher_id = auth.uid());
$$;

revoke execute on function public.is_member_of(uuid) from public, anon;
revoke execute on function public.owns_classroom(uuid) from public, anon;
grant execute on function public.is_member_of(uuid) to authenticated;
grant execute on function public.owns_classroom(uuid) to authenticated;

alter policy "classrooms: miembros las ven" on public.classrooms
  using (public.is_member_of(id));

alter policy "members: ver propia pertenencia o aula propia" on public.classroom_members
  using (student_id = auth.uid() or public.owns_classroom(classroom_id));
