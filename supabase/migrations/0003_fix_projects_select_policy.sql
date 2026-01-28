-- Fix SELECT policy for projects table
-- Allow owner to see their own project (needed for INSERT RETURNING)

-- Drop existing select policy
drop policy if exists "projects select" on projects;

-- Create new select policy that allows:
-- 1. Project owner to see their project
-- 2. Project members to see the project
create policy "projects select" on projects
for select using (
  owner_id = auth.uid()
  or exists (select 1 from project_members pm where pm.project_id = projects.id and pm.user_id = auth.uid())
);
