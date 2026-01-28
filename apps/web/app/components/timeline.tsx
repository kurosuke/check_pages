import { StatusPill } from "./status-pill";

export type TimelineItem = {
  id: string;
  status: "ok" | "error" | "changed";
  url: string;
  time: string;
  http: number;
};

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="timeline">
      {items.map((item) => (
        <div key={item.id} className="timeline-item">
          <StatusPill status={item.status} />
          <div>
            <div style={{ fontWeight: 600 }}>{item.url}</div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>
              HTTP {item.http} ・ {item.time}
            </div>
          </div>
          <div className="badge">詳細</div>
        </div>
      ))}
    </div>
  );
}
