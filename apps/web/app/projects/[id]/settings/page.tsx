import { notifications as mockNotifications } from "@/app/lib/mock-data";
import { Bell, ToggleLeft, ToggleRight, Send } from "lucide-react";
import { serviceClient } from "@/app/lib/supabase/service";

type PageProps = { params: { id: string } };

export default async function ProjectSettings({ params }: PageProps) {
  const supabase = serviceClient();
  const { data, error } = await supabase.from("notifications").select("*").eq("project_id", params.id);
  const notifications = !error && data && data.length > 0 ? data : mockNotifications;

  return (
    <div>
      <header className="header">
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>設定</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Project {params.id} / 通知設定</div>
        </div>
        <button className="button ghost">
          <Send size={16} />
          テスト送信
        </button>
      </header>

      <main className="main">
        <div className="card">
          <div className="section-title">
            <Bell size={16} />
            <h2>通知チャネル</h2>
          </div>
          <div className="grid-two">
            {notifications.map((n) => (
              <div key={n.type || n.id} className="panel" style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 600 }}>{n.type}</div>
                  {n.enabled ? <ToggleRight color="var(--primary)" /> : <ToggleLeft color="var(--muted)" />}
                </div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{n.endpoint}</div>
                <div className="stack">
                  <span className="badge">閾値: {n.threshold}</span>
                  <button className="badge">編集</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
