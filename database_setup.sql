-- 1. Create a table for public profiles
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text check (role in ('student', 'mentor', 'admin')) default 'student',
  is_verified boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- 3. Create a function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

-- 4. Create a trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. RLS Policies for the 'courses' table
alter table courses enable row level security;

-- Policy: Anyone can view courses
create policy "Courses are viewable by everyone." on courses
  for select using (true);

-- Policy: Mentors can insert their own courses
create policy "Mentors can create their own courses." on courses
  for insert with check (
    auth.uid() = mentor_id 
    and 
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'mentor'
    )
  );

-- Policy: Mentors can update their own courses
create policy "Mentors can update their own courses." on courses
  for update using (auth.uid() = mentor_id);

-- Policy: Mentors can delete their own courses
create policy "Mentors can delete their own courses." on courses
  for delete using (auth.uid() = mentor_id);
