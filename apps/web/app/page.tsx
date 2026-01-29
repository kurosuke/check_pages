import { KpiCard } from "./components/kpi-card";
import { StatusPill } from "./components/status-pill";
import { kpis as mockKpis } from "./lib/mock-data";
import { Folder, ExternalLink } from "lucide-react";
import { serviceClient } from "./lib/supabase/service";
import Link from "next/link";

type Kpi = { label: string; value: number | string; trend?: string; tone?: "highlight" | "default" };
type StatusCounts = { ok: number; changed: number; error: number };

type ProjectWithUrls = {
  id: string;
  name: string;
  urls: {
    id: string;
    url: string;
    note: string | null;
    status: "ok" | "error" | "changed";
    last_checked_at: string | null;
    latest_item_id: string | null;
  }[];
  statusCounts: StatusCounts;
};

async function loadData(): Promise<{ kpis: Kpi[]; projects: ProjectWithUrls[] }> {
  try {
    const supabase = serviceClient();

    // Get all projects
    const { data: projectsData } = await supabase
      .from("projects")
      .select("id, name")
      .order("created_at", { ascending: false });

    if (!projectsData || projectsData.length === 0) {
      return { kpis: mockKpis, projects: [] };
    }

    // Get all URLs with their latest check status
    const { data: urlsData } = await supabase
      .from("urls")
      .select("id, project_id, url, note, last_checked_at, latest_item_id")
      .eq("active", true)
      .order("created_at", { ascending: false });

    // Get latest checks for each URL
    const { data: checksData } = await supabase
      .from("checks")
      .select("url_id, status, started_at")
      .order("started_at", { ascending: false });

    // Map latest check to each URL
    const latestChecks = new Map();
    (checksData ?? []).forEach((check) => {
      if (!latestChecks.has(check.url_id)) {
        latestChecks.set(check.url_id, check);
      }
    });

    // Group URLs by project
    const projectMap = new Map<string, ProjectWithUrls>();
    projectsData.forEach((project) => {
      projectMap.set(project.id, {
        id: project.id,
        name: project.name,
        urls: [],
        statusCounts: { ok: 0, changed: 0, error: 0 }
      });
    });

    (urlsData ?? []).forEach((url) => {
      const project = projectMap.get(url.project_id);
      if (project) {
        const latestCheck = latestChecks.get(url.id);
        const status = (latestCheck?.status as "ok" | "error" | "changed") ?? "ok";

        project.urls.push({
          id: url.id,
          url: url.url,
          note: url.note,
          status,
          last_checked_at: url.last_checked_at,
          latest_item_id: url.latest_item_id
        });

        // Count statuses
        if (status === "ok") project.statusCounts.ok++;
        else if (status === "changed") project.statusCounts.changed++;
        else if (status === "error") project.statusCounts.error++;
      }
    });

    const projects = Array.from(projectMap.values());

    // Calculate global KPIs
    const totalUrls = urlsData?.length ?? 0;
    const globalCounts = projects.reduce(
      (acc, p) => ({
        ok: acc.ok + p.statusCounts.ok,
        changed: acc.changed + p.statusCounts.changed,
        error: acc.error + p.statusCounts.error
      }),
      { ok: 0, changed: 0, error: 0 }
    );

    const total = Object.values(globalCounts).reduce((a, b) => a + b, 0) || 1;
    const successRate = Math.round((globalCounts.ok / total) * 100);

    const kpis: Kpi[] = [
      { label: "監視URL", value: totalUrls },
      { label: "成功率", value: `${successRate}%` },
      { label: "エラー中", value: globalCounts.error },
      { label: "変更検知", value: globalCounts.changed, tone: "highlight" }
    ];

    return { kpis, projects };
  } catch (e) {
    console.error("Dashboard load error:", e);
    return { kpis: mockKpis, projects: [] };
  }
}

function extractLatestEpisode(url: string, latestItemId?: string | null): string | null {
  const narouMatch = url.match(/ncode\.syosetu\.com\/([^/]+)/i);
  if (!narouMatch || !latestItemId) return null;
  const parts = latestItemId.split("-");
  return parts.length > 1 ? `第${parts[parts.length - 1]}話` : null;
}

export default async function DashboardPage() {
  const { kpis, projects } = await loadData();

  return (
    <div>
      <header className="header">
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>ダッシュボード</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>すべてのプロジェクト</h1>
        </div>
      </header>

      <main className="main">
        <div className="kpis">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} trend={kpi.trend} tone={kpi.tone} />
          ))}
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <Folder size={48} />
            <h3>プロジェクトがありません</h3>
            <p>サイドバーの「新規プロジェクト」からプロジェクトを作成してください</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 24 }}>
            {projects.map((project) => (
              <section key={project.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Folder size={20} color="var(--primary)" />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{project.name}</h2>
                    <span className="badge">{project.urls.length} URLs</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <StatusPill status="ok" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{project.statusCounts.ok}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <StatusPill status="changed" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{project.statusCounts.changed}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <StatusPill status="error" />
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{project.statusCounts.error}</span>
                      </div>
                    </div>
                    <Link href={`/projects/${project.id}/urls`} className="badge">
                      <ExternalLink size={14} />
                      開く
                    </Link>
                  </div>
                </div>

                {project.urls.length === 0 ? (
                  <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                    このプロジェクトにはまだURLが登録されていません
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {project.urls.filter((url) => url.status === "changed").slice(0, 5).length === 0 ? (
                      <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                        変更検知されたURLはありません
                      </div>
                    ) : null}
                    {project.urls.filter((url) => url.status === "changed").slice(0, 5).map((url) => {
                      const episode = extractLatestEpisode(url.url, url.latest_item_id);
                      return (
                        <div key={url.id} className="url-row">
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                            <StatusPill status={url.status} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <a
                                href={url.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: "var(--info)",
                                  textDecoration: "none",
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}
                                className="url-external-link"
                              >
                                {url.url}
                              </a>
                              {url.note && (
                                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
                                  {url.note}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                            {episode && (
                              <span
                                style={{
                                  fontSize: 13,
                                  color: "var(--primary)",
                                  fontWeight: 600,
                                  padding: "4px 8px",
                                  background: "var(--primary-light)",
                                  borderRadius: 4
                                }}
                              >
                                {episode}
                              </span>
                            )}
                            {url.last_checked_at && (
                              <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                                {new Date(url.last_checked_at).toLocaleString("ja-JP", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            )}
                            <Link
                              href={`/projects/${project.id}/urls/${url.id}`}
                              className="badge"
                              style={{ textDecoration: "none", flexShrink: 0 }}
                            >
                              詳細
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                    {project.urls.filter((url) => url.status === "changed").length > 5 && (
                      <Link
                        href={`/projects/${project.id}/urls`}
                        className="view-more-link"
                      >
                        他 {project.urls.filter((url) => url.status === "changed").length - 5} 件の変更URLを表示 →
                      </Link>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
