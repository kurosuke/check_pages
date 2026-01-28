# アーキテクチャ概要

## コンポーネント
- **Frontend**: Next.js 13+/App Router (TypeScript)。UIは `docs/ui-design.md` に準拠。デプロイはVercelまたは独自Nodeコンテナ。
- **API/Server**: Next.js Route Handlers (Node runtime) で Supabase PostgREST / RPC / Storage を利用。重い処理はバックグラウンドワーカーへ委譲。
- **Auth**: Supabase Auth（Email/Password + Magic Link）。Next.js middlewareで保護。
- **DB/Storage**: Supabase Postgres + Storage。スキーマは `docs/database-design.md` 参照。
- **Worker**: URLチェック実行用のジョブランナー（Node or Deno）。Playwrightを使用するため、Next.jsランタイムとは別コンテナで実行。
- **Scheduler/Queue**: Supabase Edge Functions + pg_cron もしくは外部キュー（Supabase Queues）でジョブ投入。

## ローカル開発（Supabaseクラウド前提）
Supabase はマネージド（`https://<project>.supabase.co`）を利用し、Compose には含めない。`.env` にクラウドプロジェクトの URL / Keys を置く。

`docker-compose.yml` 想定例（抜粋）:
```yaml
version: "3.9"
services:
  web:
    build: ./apps/web   # Next.js アプリ
    command: ["npm","run","dev"]
    environment:
      NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}  # https://<project>.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
    ports:
      - "3000:3000"

  worker:
    build: ./apps/worker   # Playwright + ジョブ実行
    command: ["npm","run","start"]
    environment:
      SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      SNAPSHOT_BUCKET: snapshots
    # Playwrightが必要な場合は extra_hosts で localhost 解決や shm_size を拡張
    shm_size: "1gb"
```

### 補足
- Supabase をローカル起動せず、常にクラウドプロジェクトへ接続する前提。データは `.env` の URL / Key を共有。
- Next.js と Worker は共通の `.env` を使い、Service Role Key はサーバー側コンテナでのみ参照。フロントには anon key のみ公開。

## デプロイ戦略
- **Frontend**: Vercel (Edge不可部分は Node runtime)。環境変数で Supabase URL/Anon Key を設定。
- **Worker**: Render/ Fly.io / Railway など常駐Nodeコンテナ。Playwright用に `--no-sandbox` で Chromium を同梱。
- **Supabase**: Supabase プロジェクトに `supabase db push --project-ref <project-ref>` でマイグレーション。Storage bucket `snapshots` を作成。
- **Scheduler**: Supabase Scheduled Functions または外部Cronがワーカーの Webhook（`POST /jobs/check`）を叩きジョブ投入。

## データフロー（チェック処理）
1. Scheduler が `jobs` キューに URL を投入。
2. Worker がジョブをポーリングし、HTTP取得・差分計算・スクショを実行。
3. 結果を `checks`, `diffs` テーブルへ保存し、スクリーンショットを Storage にアップロード。
4. 変更/失敗時は通知チャネルを判定し、Email/Discord/Webhook を送信。
5. フロントは `urls` と最新 `checks` をJOINして一覧を描画。詳細は `checks` / `diffs` を参照。

## 環境変数（例）
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (サーバー/workerのみ)
- `SNAPSHOT_BUCKET=snapshots`
- `JOB_QUEUE_URL` (Supabase Queue/外部キューのエンドポイント)

## 開発運用
- `npm run dev` (web) と `npm run start` (worker) を Compose で同時起動。
- `supabase db push --project-ref <project-ref>` でクラウドへスキーマを同期。`supabase gen types typescript --linked`（事前に `supabase link` 実施）で型を生成し `@/types/db` へ配置。
- Playwrightが重い場合、ローカルでは worker を手動起動し、CIでは e2e をスキップ可能なフラグ `SKIP_SCREENSHOT=true` を設置。
