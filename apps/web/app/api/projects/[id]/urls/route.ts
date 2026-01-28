import { NextResponse } from "next/server";
import { serviceClient } from "@/app/lib/supabase/service";

// UUID format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // If project ID is not a valid UUID (e.g., "demo"), return empty array
  if (!isValidUUID(params.id)) {
    return NextResponse.json({ data: [] });
  }

  const supabase = serviceClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  let query = supabase.from("urls").select("*").eq("project_id", params.id);
  if (status) {
    const { data: ids } = await supabase
      .from("checks")
      .select("url_id")
      .eq("status", status)
      .order("started_at", { ascending: false })
      .limit(200);
    const urlIds = ids?.map((r) => r.url_id) ?? [];
    query = query.in("id", urlIds);
  }
  if (q) {
    query = query.ilike("url", `%${q}%`);
  }

  const { data, error } = await query.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

interface CreateUrlBody {
  url: string;
  tags?: string[];
  note?: string;
  expected_status?: number;
  check_interval_minutes?: number;
  keywords?: { phrase: string; must_exist: boolean }[];
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  // Validate project ID is a valid UUID
  if (!isValidUUID(params.id)) {
    return NextResponse.json(
      { error: "Invalid project ID. Please use a valid project." },
      { status: 400 }
    );
  }

  const supabase = serviceClient();
  const body: CreateUrlBody = await req.json();

  // Validation
  if (!body.url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }
  if (!/^https?:\/\/.+/.test(body.url)) {
    return NextResponse.json({ error: "URL must start with http:// or https://" }, { status: 400 });
  }
  if (body.check_interval_minutes && body.check_interval_minutes < 5) {
    return NextResponse.json({ error: "Check interval must be at least 5 minutes" }, { status: 400 });
  }
  if (body.tags) {
    for (const tag of body.tags) {
      if (tag.length > 20) {
        return NextResponse.json({ error: "Tag must be 20 characters or less" }, { status: 400 });
      }
    }
  }

  // Insert URL
  const { data: urlData, error: urlError } = await supabase
    .from("urls")
    .insert({
      project_id: params.id,
      url: body.url,
      tags: body.tags ?? [],
      note: body.note ?? null,
      expected_status: body.expected_status ?? 200,
      check_interval_minutes: body.check_interval_minutes ?? 30,
      active: true,
    })
    .select()
    .single();

  if (urlError) {
    return NextResponse.json({ error: urlError.message }, { status: 500 });
  }

  // Insert keywords if provided
  if (body.keywords && body.keywords.length > 0) {
    const keywordsToInsert = body.keywords.map((kw) => ({
      url_id: urlData.id,
      phrase: kw.phrase,
      must_exist: kw.must_exist,
    }));

    const { error: keywordError } = await supabase
      .from("keywords")
      .insert(keywordsToInsert);

    if (keywordError) {
      // URL was created but keywords failed - log but don't fail the request
      console.error("Failed to insert keywords:", keywordError);
    }
  }

  return NextResponse.json({ data: urlData }, { status: 201 });
}
