-- El trigger no necesita EXECUTE para nadie (lo ejecuta el motor de triggers).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- Los helpers de RLS solo hacen falta para usuarios con sesión (las políticas se evalúan con su rol).
revoke execute on function public.is_teacher_of(uuid) from public, anon;
revoke execute on function public.is_guardian_of(uuid) from public, anon;
grant execute on function public.is_teacher_of(uuid) to authenticated;
grant execute on function public.is_guardian_of(uuid) to authenticated;
