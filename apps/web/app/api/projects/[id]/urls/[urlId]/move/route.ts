import { NextResponse } from "next/server";
import { serviceClient } from "@/app/lib/supabase/service";

// UUID format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// POST /api/projects/[id]/urls/[urlId]/move - Move a URL to another project
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; urlId: string }> }
) {
  const { id: projectId, urlId } = await params;

  // Validate project ID and URL ID are valid UUIDs
  if (!isValidUUID(projectId)) {
    return NextResponse.json(
      { error: "Invalid project ID" },
      { status: 400 }
    );
  }
  if (!isValidUUID(urlId)) {
    return NextResponse.json(
      { error: "Invalid URL ID" },
      { status: 400 }
    );
  }

  // Parse request body
  let body: { targetProjectId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { targetProjectId } = body;

  if (!targetProjectId || !isValidUUID(targetProjectId)) {
    return NextResponse.json(
      { error: "Invalid target project ID" },
      { status: 400 }
    );
  }

  if (targetProjectId === projectId) {
    return NextResponse.json(
      { error: "Cannot move to the same project" },
      { status: 400 }
    );
  }

  const supabase = serviceClient();

  // Verify the URL belongs to the source project
  const { data: urlData, error: fetchError } = await supabase
    .from("urls")
    .select("id, project_id")
    .eq("id", urlId)
    .single();

  if (fetchError || !urlData) {
    return NextResponse.json(
      { error: "URL not found" },
      { status: 404 }
    );
  }

  if (urlData.project_id !== projectId) {
    return NextResponse.json(
      { error: "URL does not belong to this project" },
      { status: 403 }
    );
  }

  // Verify the target project exists
  const { data: targetProject, error: targetError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", targetProjectId)
    .single();

  if (targetError || !targetProject) {
    return NextResponse.json(
      { error: "Target project not found" },
      { status: 404 }
    );
  }

  // Move the URL to the target project
  const { error: updateError } = await supabase
    .from("urls")
    .update({ project_id: targetProjectId })
    .eq("id", urlId);

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
