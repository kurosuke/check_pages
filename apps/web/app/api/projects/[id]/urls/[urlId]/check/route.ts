import { NextResponse } from "next/server";
// UUID format validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id: string) => UUID_REGEX.test(id);

const functionUrl =
  process.env.CHECK_FUNCTION_URL ??
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-runner`;

type Params = { params: { id: string; urlId: string } };

const authKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

async function invokeFunction(targetUrl: string, urlId: string) {
  const response = await fetch(`${targetUrl}?url_id=${urlId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authKey}`,
      apikey: authKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url_id: urlId }),
  });

  const rawText = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(rawText);
  } catch {
    data = { message: rawText };
  }

  return { response, data };
}

export async function GET(req: Request, ctx: Params) {
  // Allow manual trigger via GET (useful for browser testing); delegates to POST logic
  return POST(req, ctx);
}

export async function POST(
  _req: Request,
  { params }: Params
) {
  if (!isValidUUID(params.id) || !isValidUUID(params.urlId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  // Call Supabase Edge Function to run a single check
  try {
    // Try configured URL first, then fallback to default check-runner
    const targets = [
      functionUrl,
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/check-runner`,
    ];

    let lastResp: Response | null = null;
    let lastData: any = null;
    for (const target of targets) {
      const { response, data } = await invokeFunction(target, params.urlId);
      lastResp = response;
      lastData = data;
      if (response.ok) {
        return NextResponse.json({ success: true, data, status: response.status });
      }
      // only continue on 404 (function not found)
      if (response.status !== 404) break;
    }

    return NextResponse.json({
      success: false,
      error: lastData?.error || lastData?.message || "Check function failed",
      status: lastResp?.status || 500,
    });
  } catch (err) {
    console.error("check-runner call failed", err);
    return NextResponse.json({ success: false, error: "Failed to call check function" });
  }
}
