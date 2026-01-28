-- Fix existing projects that don't have owner in project_members
-- This migration adds the owner as a member for any project missing that relationship

INSERT INTO project_members (project_id, user_id, role, invited_by)
SELECT p.id, p.owner_id, 'owner'::member_role, p.owner_id
FROM projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_members pm 
  WHERE pm.project_id = p.id AND pm.user_id = p.owner_id
);
