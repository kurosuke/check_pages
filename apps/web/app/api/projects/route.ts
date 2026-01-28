import { NextResponse } from "next/server";
import { createServerSupabase } from "@/app/lib/supabase/server";
import { serviceClient } from "@/app/lib/supabase/service";

// GET /api/projects - List projects for current user
export async function GET() {
  const supabase = await createServerSupabase();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  // Use service client to fetch projects where user is a member
  const service = serviceClient();
  const { data: memberships, error: memberError } = await service
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id);

  if (memberError) {
    return NextResponse.json(
      { error: memberError.message },
      { status: 500 }
    );
  }

  const projectIds = memberships?.map((m) => m.project_id) ?? [];

  if (projectIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const { data: projects, error: projectError } = await service
    .from("projects")
    .select("*")
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  if (projectError) {
    return NextResponse.json(
      { error: projectError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: projects });
}

interface CreateProjectBody {
  name: string;
}

// POST /api/projects - Create a new project
export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  console.log("Auth check - user:", user?.id, "error:", authError?.message);
  
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  const body: CreateProjectBody = await req.json();

  // Validation
  if (!body.name || body.name.trim() === "") {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    );
  }

  if (body.name.length > 100) {
    return NextResponse.json(
      { error: "Project name must be 100 characters or less" },
      { status: 400 }
    );
  }

  // Debug: Check environment variable
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("Service key exists:", !!serviceKey);
  console.log("Service key length:", serviceKey?.length);

  // Use service client to create project (bypasses RLS)
  const service = serviceClient();
  const { data: project, error: insertError } = await service
    .from("projects")
    .insert({
      name: body.name.trim(),
      owner_id: user.id,
    })
    .select()
    .single();

  console.log("Insert result:", { project, error: insertError });

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    );
  }

  // Add the creator as a project member with 'owner' role
  const { error: memberError } = await service
    .from("project_members")
    .insert({
      project_id: project.id,
      user_id: user.id,
      role: "owner",
      invited_by: user.id,
    });

  if (memberError) {
    console.error("Failed to add owner as member:", memberError);
    // Delete the project if we couldn't add the member
    await service.from("projects").delete().eq("id", project.id);
    return NextResponse.json(
      { error: "Failed to create project membership" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: project }, { status: 201 });
}
