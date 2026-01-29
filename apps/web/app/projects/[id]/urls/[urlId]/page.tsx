import { StatusPill } from "@/app/components/status-pill";
import { Clock, RefreshCcw, ShieldCheck, ExternalLink } from "lucide-react";
import { serviceClient } from "@/app/lib/supabase/service";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string; urlId: string }> };

type Check = {
  id: string;
  status: "ok" | "error" | "changed";
  http_status: number | null;
  response_ms: number | null;
  started_at: string;
  final_url: string | null;
  ssl_expires_at: string | null;
};

type Diff = {
  id: string;
  check_id: string;
  field: "html" | "meta" | "screenshot" | "keywords";
  diff_summary: Record<string, unknown> | null;
  severity: number | null;
};

type Keyword = {
  id: string;
  phrase: string;
  must_exist: boolean;
};

async function fetchUrlDetail(projectId: string, urlId: string) {
  const supabase = serviceClient();

  // URL情報を取得（project_idも検証）
  const { data: urlData, error: urlError } = await supabase
    .from("urls")
    .select("*")
    .eq("id", urlId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (urlError || !urlData) {
    return null;
  }

  // チェック履歴を取得
  const { data: checksData } = await supabase
    .from("checks")
    .select("id,status,http_status,response_ms,started_at,final_url,ssl_expires_at")
    .eq("url_id", urlId)
    .order("started_at", { ascending: false })
    .limit(50);

  const checks = (checksData ?? []) as Check[];

  // キーワードを取得
  const { data: keywordsData } = await supabase
    .from("keywords")
    .select("id,phrase,must_exist")
    .eq("url_id", urlId);

  const keywords = (keywordsData ?? []) as Keyword[];

  // 最新チェックの差分情報を取得
  let diffs: Diff[] = [];
  if (checks.length > 0) {
    const latestCheckId = checks[0].id;
    const { data: diffsData } = await supabase
      .from("diffs")
      .select("id,check_id,field,diff_summary,severity")
      .eq("check_id", latestCheckId);

    diffs = (diffsData ?? []) as Diff[];
  }

  return { urlData, checks, keywords, diffs };
}

export default async function UrlDetailPage({ params }: PageProps) {
  const { id: projectId, urlId } = await params;

  const result = await fetchUrlDetail(projectId, urlId);

  if (!result) {
    notFound();
  }

  const { urlData, checks, keywords, diffs } = result as NonNullable<typeof result>;
  const latestCheck = checks[0] ?? null;

  const target = {
    url: urlData.url,
    note: urlData.note as string | null,
    tags: urlData.tags || [],
    status: (latestCheck?.status ?? "ok") as "ok" | "error" | "changed",
    lastChecked: latestCheck?.started_at
      ? new Date(latestCheck.started_at).toLocaleString("ja-JP", { hour12: false })
      : "-",
    ssl: latestCheck?.ssl_expires_at
      ? new Date(latestCheck.ssl_expires_at).toISOString().slice(0, 10)
      : "-",
    redirect: latestCheck?.final_url ?? "-",
    response: latestCheck?.response_ms ? `${latestCheck.response_ms}ms` : "-",
    http: latestCheck?.http_status ?? 0
  };

  const timeline = checks.map((item) => ({
    id: item.id,
    status: item.status,
    url: target.url,
    http: item.http_status ?? 0,
    time: new Date(item.started_at).toLocaleString("ja-JP", { hour12: false })
  }));

  // 差分情報を整形
  const htmlDiff = diffs.find((d) => d.field === "html");
  const metaDiff = diffs.find((d) => d.field === "meta");

  const diffSummary = {
    html: htmlDiff?.diff_summary
      ? String((htmlDiff.diff_summary as Record<string, unknown>).summary ?? "差分なし")
      : "差分なし",
    meta: metaDiff?.diff_summary
      ? ((metaDiff.diff_summary as Record<string, unknown>).changes as string[]) ?? []
      : [],
    keywords: keywords.map((k) => ({
      phrase: k.phrase,
      ok: k.must_exist // 実際のチェック結果はcheckで判定すべきだがここでは設定値を表示
    }))
  };

  return (
    <div>
      <header className="header">
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>URL詳細</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{target.url}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: target.note ? "var(--text)" : "var(--muted)" }}>
            {target.note || "メモ未設定"}
          </div>
          <div className="stack" style={{ marginTop: 6 }}>
            {target.tags.map((t: string) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
            <StatusPill status={target.status} size="large" />
          </div>
        </div>
        <div className="stack">
          <button className="button ghost">
            <Clock size={16} />
            最終 {target.lastChecked}
          </button>
          <button className="button">
            <RefreshCcw size={16} />
            手動チェック
          </button>
        </div>
      </header>

      <main className="main">
        <div className="split">
          <div className="card">
            <div className="section-title">
              <h2>差分概要</h2>
              <span className="badge">今回 vs 前回</span>
            </div>
            <div className="grid-two">
              <div className="panel">
                <div style={{ fontSize: 13, color: "var(--muted)" }}>HTML</div>
                <div style={{ fontWeight: 600 }}>{diffSummary.html}</div>
              </div>
              <div className="panel">
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Meta</div>
                <div className="stack">
                  {diffSummary.meta.length > 0 ? (
                    diffSummary.meta.map((m) => (
                      <span key={m} className="tag">
                        {m}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "var(--muted)" }}>変更なし</span>
                  )}
                </div>
              </div>
              <div className="panel">
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Keywords</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {diffSummary.keywords.length > 0 ? (
                    diffSummary.keywords.map((k) => (
                      <div key={k.phrase} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{k.phrase}</span>
                        <StatusPill status={k.ok ? "ok" : "warn"} />
                      </div>
                    ))
                  ) : (
                    <span style={{ color: "var(--muted)" }}>キーワード未設定</span>
                  )}
                </div>
              </div>
              <div className="panel">
                <div style={{ fontSize: 13, color: "var(--muted)" }}>スクリーンショット</div>
                <div className="badge">差分ヒートマップを確認</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="section-title">
              <h2>メタ情報</h2>
            </div>
            <div className="grid-two">
              <div className="panel">
                <div className="mono" style={{ color: "var(--muted)" }}>
                  HTTP
                </div>
                <div style={{ fontWeight: 600 }}>{target.http || "-"}</div>
              </div>
              <div className="panel">
                <div className="mono" style={{ color: "var(--muted)" }}>
                  Response
                </div>
                <div style={{ fontWeight: 600 }}>{target.response}</div>
              </div>
              <div className="panel">
                <div className="mono" style={{ color: "var(--muted)" }}>
                  Redirect
                </div>
                <div className="mono">{target.redirect}</div>
              </div>
              <div className="panel" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldCheck size={18} color="var(--success)" />
                <div>
                  <div className="mono" style={{ color: "var(--muted)" }}>
                    SSL Exp.
                  </div>
                  <div>{target.ssl}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <h2>チェック履歴</h2>
            <span className="badge">最新50件</span>
          </div>
          {timeline.length > 0 ? (
            <div className="timeline">
              {timeline.map((item) => (
                <div key={item.id} className="timeline-item">
                  <StatusPill status={item.status} size="medium" />
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.url}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                      HTTP {item.http} ・ {item.time}
                    </div>
                  </div>
                  <a className="badge" href="#" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <ExternalLink size={14} />
                    diff
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--muted)", padding: "20px 0" }}>チェック履歴がありません</div>
          )}
        </div>
      </main>
    </div>
  );
}
