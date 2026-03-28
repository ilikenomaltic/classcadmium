-- 1. profiles에 포인트 컬럼
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- 2. items에 원소 데이터 컬럼
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS atomic_number INTEGER;

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS valence_electrons INTEGER;

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS element_group TEXT;

-- 3. quiz_assignments에 난이도 컬럼 + mode CHECK 업데이트
ALTER TABLE public.quiz_assignments ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'normal';

DO $$
DECLARE v_name text;
BEGIN
  SELECT conname INTO v_name
  FROM pg_constraint
  WHERE conrelid = 'public.quiz_assignments'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%flashcard%';
  IF v_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.quiz_assignments DROP CONSTRAINT ' || quote_ident(v_name);
  END IF;
END $$;
ALTER TABLE public.quiz_assignments ADD CONSTRAINT quiz_assignments_mode_check
  CHECK (mode IN ('flashcard', 'ox', 'blank', 'multiple', 'element'));

ALTER TABLE public.quiz_assignments ADD CONSTRAINT quiz_assignments_difficulty_check
  CHECK (difficulty IN ('easy', 'normal', 'hard'));

-- 4. 포인트 적립 RPC (atomic increment)
CREATE OR REPLACE FUNCTION public.add_points(p_user_id uuid, p_amount integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be positive';
  END IF;
  UPDATE public.profiles SET points = points + p_amount WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_points(uuid, integer) TO authenticated;

-- 5. RLS: 학생이 같은 반 학우 class_members 조회 허용
CREATE POLICY "class_members: student read classmates" ON public.class_members
  FOR SELECT USING (public.is_member_of_class(class_id));

-- 6. RLS: 학생이 같은 반 학우 프로필(name, points) 조회 허용
CREATE POLICY "profiles: classmate read" ON public.profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.class_members cm
      WHERE cm.class_id IN (
        SELECT class_id FROM public.class_members WHERE student_id = auth.uid()
      )
      AND cm.student_id = profiles.id
    )
  );
