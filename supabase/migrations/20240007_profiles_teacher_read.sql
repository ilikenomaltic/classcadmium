-- Allow teachers to read profiles of students in their classes
create policy "profiles: teacher read members" on public.profiles
  for select using (
    exists (
      select 1 from public.class_members cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = profiles.id
      and c.teacher_id = auth.uid()
    )
  );
