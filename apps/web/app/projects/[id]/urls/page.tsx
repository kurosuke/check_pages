import { urls as mockUrls, UrlRow as MockUrl } from "@/app/lib/mock-data";
import { serviceClient } from "@/app/lib/supabase/service";
import { UrlListClient } from "./url-list-client";

type PageProps = { params: { id: string } };

async function fetchUrls(projectId: string) {
  try {
    const supabase = serviceClient();
    const [urlsRes, checksRes] = await Promise.all([
      supabase.from("urls").select("*").eq("project_id", projectId).limit(200),
      supabase
        .from("checks")
        .select("url_id,status,http_status,response_ms,started_at")
        .order("started_at", { ascending: false })
        .limit(400)
    ]);

    const latestByUrl = new Map<string, any>();
    (checksRes.data ?? []).forEach((c) => {
      if (!latestByUrl.has(c.url_id)) latestByUrl.set(c.url_id, c);
    });

    const urls = urlsRes.data?.map((u) => {
      const last = latestByUrl.get(u.id);
      return {
        id: u.id,
        url: u.url,
        tags: u.tags || [],
        status: (last?.status ?? "ok") as MockUrl["status"],
        http: last?.http_status ?? 0,
        latency: last?.response_ms ?? 0,
        checked: last?.started_at
          ? new Date(last.started_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
          : "-",
        diff: "-"
      };
    }) ?? [];

    return urls;
  } catch (e) {
    console.error("Failed to fetch URLs:", e);
    return mockUrls;
  }
}

export default async function UrlListPage({ params }: PageProps) {
  const urls = await fetchUrls(params.id);

  return <UrlListClient projectId={params.id} initialUrls={urls} />;
}
