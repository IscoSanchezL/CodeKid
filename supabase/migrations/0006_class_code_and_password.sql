-- Código de clase editable por el docente (4-12 letras/números en mayúsculas) y clave de clase opcional (p. ej. «1A»).
alter table public.classrooms
  add column class_password text
    check (class_password is null or class_password ~ '^[A-Z0-9]{1,16}$');

alter table public.classrooms
  add constraint classrooms_join_code_format check (join_code ~ '^[A-Z0-9]{4,12}$');
