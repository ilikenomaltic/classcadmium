-- Simplify quiz_set_items student read policy to use security definer function
-- Previous policy had complex RLS chain that blocked students from reading items

DROP POLICY IF EXISTS "quiz_set_items: student read" ON public.quiz_set_items;

CREATE POLICY "quiz_set_items: student read" ON public.quiz_set_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_assignments qa
      WHERE qa.quiz_set_id = quiz_set_items.quiz_set_id
        AND public.is_member_of_class(qa.class_id)
    )
  );
