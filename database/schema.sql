-- Pastor Flow Database Schema
-- Run in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- ORGANIZATIONS
-- ─────────────────────────────────────────
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table organizations enable row level security;

create policy "Members can view their organization"
  on organizations for select
  using (
    id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "Owner can update their organization"
  on organizations for update
  using (
    id in (
      select organization_id from profiles
      where id = auth.uid() and role = 'owner'
    )
  );

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  name text not null default '',
  title text not null default 'Staff',
  role text not null default 'staff' check (role in ('owner', 'staff', 'intern')),
  color text not null default '#6aaa7e',
  initials text not null default '??',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Users can view org members"
  on profiles for select
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, initials)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 2))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  category text not null default 'Admin',
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  status text not null default 'Todo' check (status in ('Todo', 'In Progress', 'Waiting', 'Completed')),
  visibility text not null default 'Organization' check (visibility in ('Private', 'Organization')),
  due_date date,
  notes text,
  created_by uuid not null references profiles(id),
  assigned_to uuid references profiles(id),
  claimed_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table tasks enable row level security;

create policy "Org members can view org tasks"
  on tasks for select
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
    and (
      visibility = 'Organization'
      or created_by = auth.uid()
    )
  );

create policy "Org members can insert tasks"
  on tasks for insert
  with check (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
    and created_by = auth.uid()
  );

create policy "Task creator and assignee can update"
  on tasks for update
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
    and (
      created_by = auth.uid()
      or assigned_to = auth.uid()
      or claimed_by = auth.uid()
    )
  );

create policy "Task creator can delete"
  on tasks for delete
  using (created_by = auth.uid());

-- ─────────────────────────────────────────
-- PEOPLE CARE
-- ─────────────────────────────────────────
create table people_care (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  care_category text not null,
  last_contact_date date,
  next_follow_up_date date,
  notes text,
  status text not null default 'Needs Attention',
  visibility text not null default 'Private' check (visibility in ('Private', 'Organization')),
  created_by uuid not null references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table people_care enable row level security;

create policy "Org members can view people care"
  on people_care for select
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
    and (
      visibility = 'Organization'
      or created_by = auth.uid()
    )
  );

create policy "Org members can insert people"
  on people_care for insert
  with check (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
    and created_by = auth.uid()
  );

create policy "Creator can update people"
  on people_care for update
  using (created_by = auth.uid());

create policy "Creator can delete people"
  on people_care for delete
  using (created_by = auth.uid());

-- ─────────────────────────────────────────
-- SERMONS
-- ─────────────────────────────────────────
create table sermons (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  scripture_text text,
  series_name text,
  preaching_date date,
  status text not null default 'Idea',
  big_idea text,
  notes text,
  created_by uuid not null references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table sermons enable row level security;

create policy "Org members can view sermons"
  on sermons for select
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
  );

create policy "Org members can insert sermons"
  on sermons for insert
  with check (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
    and created_by = auth.uid()
  );

create policy "Creator can update sermons"
  on sermons for update
  using (created_by = auth.uid());

create policy "Creator can delete sermons"
  on sermons for delete
  using (created_by = auth.uid());

-- ─────────────────────────────────────────
-- PRAYER REQUESTS
-- ─────────────────────────────────────────
create table prayer_requests (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  person_name text not null,
  request text not null,
  category text not null default 'Other',
  date_added date not null default current_date,
  follow_up_date date,
  status text not null default 'Active' check (status in ('Active', 'Answered', 'Archived')),
  private_notes text,
  visibility text not null default 'Private' check (visibility in ('Private', 'Organization')),
  created_by uuid not null references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table prayer_requests enable row level security;

create policy "Org members can view prayer requests"
  on prayer_requests for select
  using (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
    and (
      visibility = 'Organization'
      or created_by = auth.uid()
    )
  );

create policy "Org members can insert prayer requests"
  on prayer_requests for insert
  with check (
    organization_id in (
      select organization_id from profiles where id = auth.uid()
    )
    and created_by = auth.uid()
  );

create policy "Creator can update prayer requests"
  on prayer_requests for update
  using (created_by = auth.uid());

create policy "Creator can delete prayer requests"
  on prayer_requests for delete
  using (created_by = auth.uid());

-- ─────────────────────────────────────────
-- RHYTHM ITEMS
-- ─────────────────────────────────────────
create table rhythm_items (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  day_of_week text,
  is_recurring boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table rhythm_items enable row level security;

create policy "Owner can view own rhythm items"
  on rhythm_items for select
  using (profile_id = auth.uid());

create policy "Owner can insert rhythm items"
  on rhythm_items for insert
  with check (profile_id = auth.uid());

create policy "Owner can update rhythm items"
  on rhythm_items for update
  using (profile_id = auth.uid());

create policy "Owner can delete rhythm items"
  on rhythm_items for delete
  using (profile_id = auth.uid());

-- ─────────────────────────────────────────
-- RHYTHM COMPLETIONS
-- ─────────────────────────────────────────
create table rhythm_completions (
  id uuid primary key default uuid_generate_v4(),
  rhythm_item_id uuid not null references rhythm_items(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  completed_date date not null,
  created_at timestamptz default now(),
  unique (rhythm_item_id, completed_date)
);

alter table rhythm_completions enable row level security;

create policy "Owner can view own completions"
  on rhythm_completions for select
  using (profile_id = auth.uid());

create policy "Owner can insert completions"
  on rhythm_completions for insert
  with check (profile_id = auth.uid());

create policy "Owner can delete completions"
  on rhythm_completions for delete
  using (profile_id = auth.uid());

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER HELPER
-- ─────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on organizations
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on profiles
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on tasks
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on people_care
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on sermons
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on prayer_requests
  for each row execute procedure set_updated_at();
create trigger set_updated_at before update on rhythm_items
  for each row execute procedure set_updated_at();

-- ─────────────────────────────────────────
-- REALTIME
-- ─────────────────────────────────────────
-- Enable realtime for tasks (for live collaboration)
alter publication supabase_realtime add table tasks;
