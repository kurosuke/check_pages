# Supabase Functions での定期サイトチェック実行

## 目的
- Supabase Edge Functions + スケジュール（cron）でURLチェックを自動実行し、結果を Postgres に保存する。
- Next.js からは「手動チェック要求」や履歴参照のみを行い、定期実行は Supabase 側に寄せる。

## 前提
- テーブルは `docs/database-design.md` の `urls`, `checks`, `diffs` 等を使用。
- Storage bucket `snapshots` 作成済み（スクリーンショットを後で追加する場合）。
- `supabase functions deploy check-runner --project-ref <project>` 済み。
- 環境変数: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SNAPSHOT_BUCKET`（任意）。

## スケジュール設定
Supabase ダッシュボード → Edge Functions → Schedule で cron を設定。例: 5分おき。
```
*/5 * * * *  check-runner
```

## データ取得ロジック
- `urls.active = true` かつ `last_checked_at + check_interval_minutes <= now()` を対象にする。
- 過負荷回避のため1回の実行で最大N件（例: 50）に制限。

### 補助ビュー（任意）
```sql
create view due_urls as
select u.*
from urls u
where u.active
  and (u.last_checked_at is null
       or u.last_checked_at + (u.check_interval_minutes || ' minutes')::interval <= now())
order by u.last_checked_at nulls first
limit 50;
```

## Edge Function サンプル（Deno）
```ts
// supabase/functions/check-runner/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey, { global: { fetch } });

type UrlRow = {
  id: string;
  project_id: string;
  url: string;
  expected_status: number | null;
};

const MAX_BATCH = 20;
const TIMEOUT_MS = 12_000;

async function fetchDueUrls(): Promise<UrlRow[]> {
  const { data, error } = await supabase
    .from("due_urls") // view 推奨。なければ直接 where 条件
    .select("*")
    .limit(MAX_BATCH);
  if (error) throw error;
  return data ?? [];
}

async function runCheck(row: UrlRow) {
  const started_at = new Date().toISOString();
  let status: "ok" | "changed" | "error" = "ok";
  let http_status: number | null = null;
  let response_ms: number | null = null;
  let error_message: string | null = null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const t0 = performance.now();
    const res = await fetch(row.url, { redirect: "follow", signal: controller.signal });
    const html = await res.text();
    const t1 = performance.now();
    http_status = res.status;
    response_ms = Math.round(t1 - t0);

    // 簡易ハッシュ（本番は正規化＋安定化を推奨）
    const encoder = new TextEncoder();
    const content_hash = crypto.subtle.digestSync("SHA-256", encoder.encode(html));
    const hash_hex = Array.from(new Uint8Array(content_hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 直近成功と比較
    const { data: last, error: lastErr } = await supabase
      .from("checks")
      .select("content_hash")
      .eq("url_id", row.id)
      .eq("status", "ok")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastErr) throw lastErr;
    if (last?.content_hash && last.content_hash !== hash_hex) status = "changed";

    await supabase.from("checks").insert({
      url_id: row.id,
      started_at,
      finished_at: new Date().toISOString(),
      status,
      http_status,
      response_ms,
      content_hash: hash_hex,
    });

    await supabase.from("urls").update({ last_checked_at: new Date().toISOString() }).eq("id", row.id);
  } catch (e) {
    error_message = e instanceof Error ? e.message : String(e);
    status = "error";
    await supabase.from("checks").insert({
      url_id: row.id,
      started_at,
      finished_at: new Date().toISOString(),
      status,
      http_status,
      response_ms,
      error_message,
    });
    await supabase.from("urls").update({ last_checked_at: new Date().toISOString() }).eq("id", row.id);
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async () => {
  const urls = await fetchDueUrls();
  for (const row of urls) {
    await runCheck(row);
  }
  return new Response(JSON.stringify({ processed: urls.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### ポイント
- `SUPABASE_SERVICE_ROLE_KEY` を使うため、RLSを超えて書き込み可能。外部公開はしない。
- タイムアウト/リトライを適宜追加。大量処理はバッチを分割する。
- `content_hash` の計算は本番では HTML 正規化（空白・script除去など）を入れる。
- スクリーンショットやメタ差分が必要になれば、Playwright入りの別ワーカーを呼ぶ or Edge Function に `--no-sandbox` Chromium を組み込む（実行時間制限に注意）。

## Next.js との役割分担
- Next.js: URL CRUD、履歴閲覧、手動チェックのトリガー（キュー投入）。  
- Supabase Function: 定期チェック実行・結果保存。  
- 将来、通知送信やスクショ処理を分割する場合は別 Function/キューに切り出す。

## 最小セットアップ手順
1. 上記 view/enum/テーブルを DB に反映（`supabase db push`）。
2. `supabase functions new check-runner` で雛形を作り、上記コードを配置。
3. `supabase functions deploy check-runner` → ダッシュボードでスケジュール設定。
4. `urls` にデータを入れて動作確認。`checks` にレコードが増えることを確認。

## 連載更新（1日1回チェック）のロジック例
- 前提: 連載ページが RSS/Atom を提供している場合はフィードを優先。無い場合は HTML から最新話リンク・日時を抽出する。
- 追加カラム案（urls または専用テーブルに保持）
  - `latest_item_id`（文字列: エピソードのID/URL/タイトルハッシュ）
  - `latest_item_published_at`（timestamptz）
- 処理手順（毎晩の cron）
  1) 対象URLを1日1回キューに入れる（`check_interval_minutes` を 1440 に設定）。
  2) 取得：RSS/AtomならXMLをパースし先頭エントリを取得。なければHTMLを正規化し、選択セレクタで「第◯話」「更新日」などのパターンを抽出。
  3) `item_id` を決定（優先順: エントリの `<id>` / `<link>` / `<title>` のハッシュ）。
  4) `item_id` が `latest_item_id` と異なれば「更新あり」と判定し、`checks.status = 'changed'`、`diffs` に `{field:'html', diff_summary:{latest:item_id}}` を記録。`latest_item_id` と `latest_item_published_at` を更新。
  5) 同一 `item_id` なら `status='ok'` としてチェックのみ記録。
  6) 通知しきい値が `changed` のチャンネルに対してのみ送信。
- 失敗時は `status='error'` で `error_message` に理由を格納。リトライは翌日のバッチに任せる（連載用途では1回/日で十分）。
- パフォーマンス最適化
  - `If-Modified-Since` / `If-None-Match` を送信し、304 なら `status='ok'` で早期終了。
  - HTML解析は軽量な正規表現 or `DOMParser`（Edge Functions）で必要最小限の要素のみ抽出。
- 可変フォーマットへの耐性
  - 抽出セレクタは URL ごとに設定可能にする（例: data attributes や特定クラス名）。
  - フォールバックとして本文テキストのハッシュも併用し、セレクタが壊れても更新検知は継続。
