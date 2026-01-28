type Status = "ok" | "error" | "changed" | "warn";

export function StatusPill({ status }: { status: Status }) {
  const labels: Record<Status, string> = {
    ok: "OK",
    error: "Error",
    changed: "Changed",
    warn: "Warn"
  };
  return <span className={`pill ${status}`}>{labels[status]}</span>;
}
