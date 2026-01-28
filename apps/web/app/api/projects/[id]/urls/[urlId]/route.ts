import { NextResponse } from "next/server";
import { serviceClient } from "@/app/lib/supabase/service";

// UUID format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// DELETE /api/projects/[id]/urls/[urlId] - Delete a URL
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; urlId: string } }
) {
  // Validate project ID and URL ID are valid UUIDs
  if (!isValidUUID(params.id)) {
    return NextResponse.json(
      { error: "Invalid project ID" },
      { status: 400 }
    );
  }
  if (!isValidUUID(params.urlId)) {
    return NextResponse.json(
      { error: "Invalid URL ID" },
      { status: 400 }
    );
  }

  const supabase = serviceClient();

  // Verify the URL belongs to the project
  const { data: urlData, error: fetchError } = await supabase
    .from("urls")
    .select("id, project_id")
    .eq("id", params.urlId)
    .single();

  if (fetchError || !urlData) {
    return NextResponse.json(
      { error: "URL not found" },
      { status: 404 }
    );
  }

  if (urlData.project_id !== params.id) {
    return NextResponse.json(
      { error: "URL does not belong to this project" },
      { status: 403 }
    );
  }

  // Delete the URL (cascade will delete related checks, diffs, keywords)
  const { error: deleteError } = await supabase
    .from("urls")
    .delete()
    .eq("id", params.urlId);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
