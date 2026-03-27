-- Fix handle_new_user trigger: restore requested_role logic + add student_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, requested_role, student_id)
  VALUES (
    new.id,
    new.email,
    'student',
    coalesce(new.raw_user_meta_data->>'name', ''),
    CASE WHEN new.raw_user_meta_data->>'role' = 'teacher' THEN 'teacher' ELSE NULL END,
    new.raw_user_meta_data->>'student_id'
  );
  RETURN new;
END;
$$;
