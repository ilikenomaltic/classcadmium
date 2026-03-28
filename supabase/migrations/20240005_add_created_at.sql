-- Add created_at column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Update trigger to also set created_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, name, requested_role, student_id, created_at)
  VALUES (
    new.id,
    new.email,
    'student',
    coalesce(new.raw_user_meta_data->>'name', ''),
    CASE WHEN new.raw_user_meta_data->>'role' = 'teacher' THEN 'teacher' ELSE NULL END,
    new.raw_user_meta_data->>'student_id',
    now()
  );
  RETURN new;
END;
$$;
