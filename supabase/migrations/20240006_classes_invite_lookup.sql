-- Allow any authenticated user to look up a class (needed for invite code join)
create policy "classes: authenticated read" on public.classes
  for select using (auth.role() = 'authenticated');
