-- ============================================================
-- Classcadmium — Initial Schema
-- ============================================================

-- profiles (mirrors auth.users, populated by trigger)
create table public.profiles (
  id    uuid primary key references auth.users on delete cascade,
  email text not null,
  role  text not null check (role in ('student', 'teacher', 'admin')),
  name  text not null
);

-- Trigger: auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, role, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- classes
-- ============================================================
create table public.classes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  invite_code char(6) not null unique
);

create table public.class_members (
  class_id   uuid references public.classes(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  primary key (class_id, student_id)
);

-- ============================================================
-- categories + items
-- ============================================================
create table public.categories (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.items (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  front       text not null,
  back        text not null,
  image_url   text
);

-- ============================================================
-- quiz tables
-- ============================================================
create table public.quiz_sets (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.quiz_set_items (
  id              uuid primary key default gen_random_uuid(),
  quiz_set_id     uuid not null references public.quiz_sets(id) on delete cascade,
  item_id         uuid references public.items(id) on delete set null,
  front_override  text,
  back_override   text
);

create table public.quiz_assignments (
  id          uuid primary key default gen_random_uuid(),
  quiz_set_id uuid not null references public.quiz_sets(id) on delete cascade,
  class_id    uuid not null references public.classes(id) on delete cascade,
  due_date    date,
  mode        text not null check (mode in ('flashcard', 'ox', 'blank'))
);

create table public.quiz_results (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references public.profiles(id) on delete cascade,
  quiz_set_id   uuid not null references public.quiz_sets(id) on delete cascade,
  assignment_id uuid references public.quiz_assignments(id) on delete set null,
  score         integer not null,
  answers       jsonb not null default '{}',
  submitted_at  timestamptz default now(),
  unique(student_id, assignment_id)
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.classes        enable row level security;
alter table public.class_members  enable row level security;
alter table public.categories     enable row level security;
alter table public.items          enable row level security;
alter table public.quiz_sets      enable row level security;
alter table public.quiz_set_items enable row level security;
alter table public.quiz_assignments enable row level security;
alter table public.quiz_results   enable row level security;

-- helper: is the current user a member of a class?
create or replace function public.is_member_of_class(p_class_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.class_members
    where class_id = p_class_id and student_id = auth.uid()
  );
$$;

-- helper: is the current user the teacher of a class?
create or replace function public.is_teacher_of_class(p_class_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.classes
    where id = p_class_id and teacher_id = auth.uid()
  );
$$;

-- profiles
create policy "profiles: own row" on public.profiles
  for all using (id = auth.uid());

-- categories + items: read-only for all authenticated users
create policy "categories: read" on public.categories
  for select using (auth.role() = 'authenticated');

create policy "items: read" on public.items
  for select using (auth.role() = 'authenticated');

-- classes
create policy "classes: teacher full" on public.classes
  for all using (teacher_id = auth.uid());

create policy "classes: student read" on public.classes
  for select using (public.is_member_of_class(id));

-- class_members
create policy "class_members: teacher manage" on public.class_members
  for all using (public.is_teacher_of_class(class_id));

create policy "class_members: student read own" on public.class_members
  for select using (student_id = auth.uid());

create policy "class_members: student join" on public.class_members
  for insert with check (student_id = auth.uid());

-- quiz_sets
create policy "quiz_sets: teacher full" on public.quiz_sets
  for all using (teacher_id = auth.uid());

create policy "quiz_sets: student read assigned" on public.quiz_sets
  for select using (
    exists (
      select 1 from public.quiz_assignments qa
      join public.class_members cm on cm.class_id = qa.class_id
      where qa.quiz_set_id = id and cm.student_id = auth.uid()
    )
  );

-- quiz_set_items
create policy "quiz_set_items: teacher full" on public.quiz_set_items
  for all using (
    exists (select 1 from public.quiz_sets where id = quiz_set_id and teacher_id = auth.uid())
  );

create policy "quiz_set_items: student read" on public.quiz_set_items
  for select using (
    exists (
      select 1 from public.quiz_sets qs
      join public.quiz_assignments qa on qa.quiz_set_id = qs.id
      join public.class_members cm on cm.class_id = qa.class_id
      where qs.id = quiz_set_id and cm.student_id = auth.uid()
    )
  );

-- quiz_assignments
create policy "quiz_assignments: teacher full" on public.quiz_assignments
  for all using (public.is_teacher_of_class(class_id));

create policy "quiz_assignments: student read" on public.quiz_assignments
  for select using (public.is_member_of_class(class_id));

-- quiz_results
create policy "quiz_results: student own" on public.quiz_results
  for all using (student_id = auth.uid());

create policy "quiz_results: teacher read" on public.quiz_results
  for select using (
    exists (
      select 1 from public.quiz_sets where id = quiz_set_id and teacher_id = auth.uid()
    )
  );
