import { KpiCard } from "./components/kpi-card";
import { Timeline } from "./components/timeline";
import { StatusPill } from "./components/status-pill";
import { kpis as mockKpis, timeline as mockTimeline } from "./lib/mock-data";
import { Filter, RefreshCcw } from "lucide-react";
import { serviceClient } from "./lib/supabase/service";

type Kpi = { label: string; value: number | string; trend?: string; tone?: "highlight" | "default" };
type StatusCounts = { ok: number; changed: number; error: number };

async function loadData(): Promise<{ kpis: Kpi[]; timeline: any[]; counts: StatusCounts }> {
  try {
    const supabase = serviceClient();

    const [{ count: urlCount }, recentChecksRes, last24h] = await Promise.all([
      supabase.from("urls").select("id", { count: "exact", head: true }),
      supabase
        .from("checks")
        .select("id,status,http_status,started_at,url_id,urls(url)", { count: "exact" })
        .order("started_at", { ascending: false })
        .limit(20),
      supabase
        .from("checks")
        .select("status,started_at")
        .gte("started_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    const timeline =
      recentChecksRes.data?.map((c) => ({
        id: c.id,
        status: c.status as "ok" | "error" | "changed",
        url: (c as any).urls?.url ?? "",
        time: new Date(c.started_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
        http: c.http_status ?? 0
      })) ?? mockTimeline;

    const statusCounts = (last24h.data ?? []).reduce<StatusCounts>(
      (acc, row) => {
        if (row.status === "ok") acc.ok += 1;
        else if (row.status === "changed") acc.changed += 1;
        else if (row.status === "error") acc.error += 1;
        return acc;
      },
      { ok: 0, changed: 0, error: 0 }
    );

    const total24h = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;
    const successRate = Math.round(((statusCounts["ok"] || 0) / total24h) * 100);

    const kpis: Kpi[] = [
      { label: "監視URL", value: urlCount ?? 0 },
      { label: "24h 成功率", value: `${successRate}%` },
      { label: "エラー中", value: statusCounts["error"] || 0 },
      { label: "変更検知", value: statusCounts["changed"] || 0, tone: "highlight" }
    ];

    return { kpis, timeline, counts: statusCounts };
  } catch (e) {
    return {
      kpis: mockKpis,
      timeline: mockTimeline,
      counts: { ok: 0, changed: 0, error: 0 }
    };
  }
}

export default async function DashboardPage() {
  const { kpis, timeline, counts } = await loadData();

  return (
    <div>
      <header className="header">
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>プロジェクト</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Demo Project</div>
        </div>
        <div className="stack">
          <button className="button ghost">
            <Filter size={16} />
            フィルタ
          </button>
          <button className="button">
            <RefreshCcw size={16} />
            手動チェック
          </button>
        </div>
      </header>

      <main className="main">
        <div className="kpis">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} trend={kpi.trend} tone={kpi.tone} />
          ))}
        </div>

        <div className="split">
          <div className="card">
            <div className="section-title">
              <h2>直近チェック</h2>
              <span className="badge">{timeline.length}</span>
            </div>
            <Timeline items={timeline} />
          </div>
          <div className="card">
            <div className="section-title">
              <h2>ステータス内訳</h2>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <StatusPill status="ok" />
                <strong>{counts.ok}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <StatusPill status="changed" />
                <strong>{counts.changed}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <StatusPill status="error" />
                <strong>{counts.error}</strong>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
