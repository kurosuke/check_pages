export default function GlobalSettings() {
  return (
    <div>
      <header className="header">
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>全体設定</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>アカウント & API</div>
        </div>
      </header>
      <main className="main">
        <div className="card">
          <div className="section-title">
            <h2>Supabase 接続</h2>
            <span className="badge">サービス版</span>
          </div>
          <div className="grid-two">
            <div className="panel">
              <div style={{ color: "var(--muted)", fontSize: 12 }}>SUPABASE_URL</div>
              <div className="mono">https://your-project.supabase.co</div>
            </div>
            <div className="panel">
              <div style={{ color: "var(--muted)", fontSize: 12 }}>ANON_KEY</div>
              <div className="mono">••••••••••</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
