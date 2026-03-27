-- Add requested_role column for pending teacher approval
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requested_role text;

-- Update handle_new_user trigger: teacher signups become student + requested_role='teacher'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, requested_role)
  VALUES (
    new.id,
    new.email,
    'student',
    coalesce(new.raw_user_meta_data->>'name', ''),
    CASE WHEN new.raw_user_meta_data->>'role' = 'teacher' THEN 'teacher' ELSE NULL END
  );
  RETURN new;
END;
$$;
