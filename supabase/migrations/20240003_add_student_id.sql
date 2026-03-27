-- Add student_id column to profiles
alter table public.profiles
  add column if not exists student_id text;

-- Update trigger to also save student_id
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role, name, student_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'student_id'
  );
  return new;
end;
$$;
