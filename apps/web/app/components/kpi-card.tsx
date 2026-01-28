import { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  trend?: string;
  tone?: "default" | "highlight";
};

export function KpiCard({ label, value, trend, tone = "default" }: Props) {
  return (
    <div className={`card ${tone === "highlight" ? "highlight" : ""}`}>
      <h3>{label}</h3>
      <div className="value">{value}</div>
      {trend ? (
        <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>前日比 {trend}</div>
      ) : null}
    </div>
  );
}
