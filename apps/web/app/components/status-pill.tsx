type Status = "ok" | "error" | "changed" | "warn";
type Size = "small" | "medium" | "large";

interface StatusPillProps {
  status: Status;
  size?: Size;
}

export function StatusPill({ status, size = "medium" }: StatusPillProps) {
  const labels: Record<Status, string> = {
    ok: "OK",
    error: "Error",
    changed: "Changed",
    warn: "Warn"
  };
  return <span className={`pill ${status} pill-${size}`}>{labels[status]}</span>;
}
