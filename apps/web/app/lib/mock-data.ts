export const kpis = [
  { label: "監視URL", value: 42, trend: "+3" },
  { label: "24h 成功率", value: "98%", trend: "-0.5%" },
  { label: "エラー中", value: 2, trend: "+1" },
  { label: "変更検知", value: 5, trend: "-2", tone: "highlight" as const }
];

export const timeline = [
  { id: "1", status: "ok" as const, url: "https://example.com", time: "09:12", http: 200 },
  { id: "2", status: "changed" as const, url: "https://blog.example.com", time: "08:55", http: 200 },
  { id: "3", status: "error" as const, url: "https://store.example.com", time: "08:48", http: 500 },
  { id: "4", status: "ok" as const, url: "https://docs.example.com", time: "08:42", http: 200 }
];

export type UrlRow = {
  id: string;
  url: string;
  tags: string[];
  note?: string | null;
  latestEpisode: string | null;
  status: "ok" | "error" | "changed";
  latency: number;
  checked: string;
};

export const urls: UrlRow[] = [
  {
    id: "u1",
    url: "https://example.com",
    tags: ["marketing"],
    note: "LP",
    latestEpisode: null,
    status: "ok",
    latency: 420,
    checked: "2026/01/29 09:12 JST"
  },
  {
    id: "u2",
    url: "https://store.example.com",
    tags: ["shop", "prod"],
    note: "EC本番",
    latestEpisode: null,
    status: "error",
    latency: 0,
    checked: "2026/01/29 08:48 JST"
  },
  {
    id: "u3",
    url: "https://blog.example.com",
    tags: ["content"],
    note: "週次更新ブログ",
    latestEpisode: null,
    status: "changed",
    latency: 580,
    checked: "2026/01/29 08:55 JST"
  },
  {
    id: "u4",
    url: "https://status.example.com",
    tags: ["status"],
    note: "ステータスページ",
    latestEpisode: null,
    status: "ok",
    latency: 180,
    checked: "2026/01/29 08:40 JST"
  }
];

export const diffSummary = {
  html: "変更率 2.3%（38 chars差分）",
  meta: ["og:title 更新", "description 追加"],
  keywords: [
    { phrase: "sale", ok: true },
    { phrase: "outage", ok: true },
    { phrase: "beta", ok: false }
  ]
};

export const notifications = [
  { type: "Email", endpoint: "alerts@example.com", threshold: "error", enabled: true },
  { type: "Discord", endpoint: "https://discord.gg/.../hook", threshold: "changed", enabled: true },
  { type: "Webhook", endpoint: "https://hooks.slack.com/.../T123", threshold: "any", enabled: false }
];
