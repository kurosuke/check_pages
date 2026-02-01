import { urls as mockUrls, UrlRow as MockUrl } from "@/app/lib/mock-data";
import { serviceClient } from "@/app/lib/supabase/service";
import { UrlListClient } from "./url-list-client";

// キャッシュを無効化して常に最新データを取得
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function extractLatestNarouEpisode(url: string, latestItemId?: string | null): string | null {
  const narouMatch = url.match(/ncode\.syosetu\.com\/([^/]+)/i);
  if (!narouMatch || !latestItemId) return null;
  const parts = latestItemId.split("-");
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

async function fetchUrls(projectId: string) {
  try {
    const supabase = serviceClient();
    const [projectRes, urlsRes, checksRes] = await Promise.all([
      supabase.from("projects").select("name").eq("id", projectId).single(),
      supabase.from("urls").select("*").eq("project_id", projectId).limit(200),
      supabase
        .from("checks")
        .select("url_id,status,response_ms,started_at")
        .order("started_at", { ascending: false })
        .limit(400)
    ]);

    const latestByUrl = new Map<string, any>();
    (checksRes.data ?? []).forEach((c) => {
      if (!latestByUrl.has(c.url_id)) latestByUrl.set(c.url_id, c);
    });

    const urls = urlsRes.data?.map((u) => {
      const last = latestByUrl.get(u.id);
      const latestEpisode = extractLatestNarouEpisode(u.url, u.latest_item_id);
      return {
        id: u.id,
        url: u.url,
        tags: u.tags || [],
        note: u.note || null,
        latestEpisode,
        status: (last?.status ?? "ok") as MockUrl["status"],
        latency: last?.response_ms ?? 0,
        checked: last?.started_at
          ? new Date(last.started_at).toLocaleString("ja-JP", {
              timeZone: "Asia/Tokyo",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short"
            })
          : "-"
      };
    }) ?? [];

    return { projectName: projectRes.data?.name ?? "Unknown Project", urls };
  } catch (e) {
    console.error("Failed to fetch URLs:", e);
    return { projectName: "Unknown Project", urls: mockUrls };
  }
}

export default async function UrlListPage({ params }: PageProps) {
  const { id: projectId } = await params;
  const { projectName, urls } = await fetchUrls(projectId);

  return <UrlListClient projectId={projectId} projectName={projectName} initialUrls={urls} />;
}
