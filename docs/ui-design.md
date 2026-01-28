# UI Design (Next.js Dashboard)

## 全体トーン
- シンプルな監視ダッシュボード。カード＋表ベースで状態を即把握。
- ダーク/ライト両対応、色は「情報＝青」「警告＝黄」「エラー＝赤」「変更＝紫」を明示的に。
- コンポーネントはヘッダー/サイドナビ/メインコンテンツの3エリア。モバイルではドロワーメニュー。

## IA（情報設計）
- `/` → プロジェクト選択 or 最新アクティビティ概要。
- `/projects/:id/urls` → URL一覧（主要画面）。
- `/projects/:id/urls/:urlId` → URL詳細・履歴。
- `/projects/:id/settings` → 通知設定・メンバー管理。

## 主要画面

### 1. ダッシュボード（プロジェクトホーム）
- KPIカード: 監視URL数、24h 成功率、エラー中URL数、変更検知数。
- 直近チェックのタイムライン（status別のドット＋URL名、クリックで詳細）。
- フィルタ: ステータス（ok/changed/error）、タグ、期間。

### 2. URL一覧
- テーブル列: チェックボックス、URL（favicon付き）、タグ、最新ステータスアイコン、HTTPコード、レスポンスms、最終チェック時刻、差分バッジ、アクション（詳細/手動チェック/編集）。
- バルク操作: 手動チェック、アクティブ切替、タグ付け。
- 検索バー: URL/タグ/メモ全文検索。
- 無限スクロール or ページネーション切替可能。

### 3. URL登録・編集モーダル
- フィールド: URL, タグ（複数入力チップ）, メモ, 期待ステータス, チェック頻度(分), キーワード監視（phrase + must_exist toggle）。
- バリデーション: http/https 必須, 頻度最小5分, タグは20文字以内。
- プレビュー: 直近取得結果があればメタタイトル/descriptionをサイド表示。

### 4. URL詳細
- ヘッダー: URL, タグ, ステータスバッジ, 手動チェックボタン, 最終チェック時刻。
- 差分概要カード: HTML差分率、メタ変更有無、キーワード結果、スクショ差分%。
- チェック履歴タイムライン: ステータス色付きドット＋時刻＋HTTPコード＋duration。
- タブ:
  - `Diff`: 左右分割で前回 vs 今回の HTMLテキスト差分（ハイライト）、メタフィールドの変更リスト。
  - `Screenshot`: 2枚表示 + 差分ヒートマップトグル。
  - `Headers`: 取得ヘッダーとリダイレクトチェーン。
  - `Keywords`: 監視ワードごとの結果（存在/不在/エラー）。
- サイドバー: SSL有効期限、HSTS、最終リダイレクト先、Robots/Noindex判定。

### 5. 通知設定
- 通知チャネルカード: Email, Discord, Webhook。オン/オフトグル、エンドポイント入力。
- 条件: any / error / changed をラジオで選択。
- テスト送信ボタン。

### 6. メンバー管理
- メンバー一覧: アイコン、メール、ロール。ロール変更と削除ボタン。
- 招待: メール入力 → Supabase Auth invite フロー（メール送信）。

## コンポーネント粒度
- `StatusPill` (ok/changed/error)
- `TagChips` (filterable)
- `KpiCard`
- `Timeline` (status色)
- `DiffViewer` (unified/side-by-side切替, lazy load)
- `ScreenshotCompare` (slider + diff overlay)
- `DataTable` (列表示切替、ソート、フィルタ)
- `KeywordList` (result badge)

## ステート管理
- Supabase client for auth/session; server componentsで初期データ fetch、client component で相互作用。
- URL一覧のフィルタ/ソートは URL クエリパラメータ同期。
- 手動チェック実行は API Route 呼び出し → 楽観的 UI 更新（ステータスを "running" 表示）。
- Webhook/Discord テスト送信はトーストで結果表示。

## レスポンシブ
- モバイル: サイドバーを `Sheet` で隠し、表はカード型リストに自動変形（主要ステータスのみ表示）。
- 横幅≥1024px: 表 + 右ペイン（選択行のサマリー）を2カラム表示。

## アクセシビリティ & UX
- ステータス色に加えアイコンとテキストを併用し色覚多様性に配慮。
- 主要操作にキーボードショートカット: `/` で検索フォーカス、`f` でフィルタ、`r` で手動チェック。
- ローディング状態を skeleton と spinner の組み合わせで短時間でも可視化。

## 主要API I/O（フロント観点）
- `GET /api/projects/:id/urls?status=&tag=&q=&page=` → list
- `POST /api/projects/:id/urls` (body: url, tags, note, expected_status, check_interval_minutes, keywords[])
- `POST /api/urls/:urlId/check` → 手動チェック開始
- `GET /api/urls/:urlId/checks?limit=50` → 履歴
- `GET /api/checks/:id/diff` → 差分詳細 (json + signed URLs)
- `PATCH /api/projects/:id/notifications/:nid` → 更新

## 初期画面モック（テキスト）
- Header: プロジェクト名 + ユーザーMenu
- KPIs: [監視URL 42] [24h成功率 98%] [エラー 2] [変更 5]
- フィルタバー: Status pill (All/OK/Changed/Error) | Tag dropdown | Search box
- テーブル行例: `[🔵] https://example.com  Tags: marketing  HTTP 200  420ms  Checked 09:12  Diff 0.8%  [Detail] [Check]`

## 今後のUI拡張余地
- アラートノイズ低減のため「サプレッションルール」を設定する画面。
- SLAレポート出力（月次 PDF/CSV）。
- 複数URLをグラフで応答時間トレンド比較するチャートタブ。
