-- Add INSERT policy for projects table
-- Allows authenticated users to create new projects

-- Drop existing modify policy and split into separate policies
drop policy if exists "projects modify" on projects;

-- Allow owner to update their projects
create policy "projects update" on projects
for update using (
  projects.owner_id = auth.uid()
);

-- Allow owner to delete their projects
create policy "projects delete" on projects
for delete using (
  projects.owner_id = auth.uid()
);

-- Allow any authenticated user to insert a project (they become the owner)
create policy "projects insert" on projects
for insert with check (
  auth.uid() is not null
  and owner_id = auth.uid()
);
