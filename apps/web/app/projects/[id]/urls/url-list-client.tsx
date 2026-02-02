"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, PlayCircle, Plus, Trash2, MoreVertical, ExternalLink, RefreshCw, Edit2, FolderInput, RotateCw } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/app/components/status-pill";
import { AddUrlModal } from "@/app/components/add-url-modal";
import { useToast } from "@/app/components/ui/toast";
import { ButtonSpinner } from "@/app/components/ui/spinner";
import { DropdownMenu, DropdownItem, DropdownDivider } from "@/app/components/ui/dropdown-menu";
import { MoveUrlModal } from "@/app/components/move-url-modal";
import { useRouter } from "next/navigation";

interface UrlRow {
  id: string;
  url: string;
  tags: string[];
  latestEpisode: string | null;
  note?: string | null;
  status: "ok" | "changed" | "error";
  latency: number;
  checked: string;
}

interface UrlListClientProps {
  projectId: string;
  projectName: string;
  initialUrls: UrlRow[];
}

const parseUrlParts = (raw: string) => {
  try {
    const u = new URL(raw);
    const path = `${u.pathname}${u.search}${u.hash}`;
    return { domain: u.host, path: path === "/" ? "" : path };
  } catch {
    return { domain: raw, path: "" };
  }
};

export function UrlListClient({ projectId, projectName, initialUrls }: UrlListClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [bulkChecking, setBulkChecking] = useState(false);
  const [moveModalUrl, setMoveModalUrl] = useState<{ id: string; url: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      router.refresh();
      showToast("一覧を更新しました", "success");
    } finally {
      // router.refreshは非同期だが完了を待てないので少し待つ
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleAddSuccess = () => {
    // Refresh the page to fetch new data from server
    router.refresh();
  };

  const handleDelete = async (urlId: string, urlText: string) => {
    if (!confirm(`「${urlText}」を削除しますか？\nこのURLに関連するすべてのチェック履歴も削除されます。`)) {
      return;
    }

    setDeletingId(urlId);
    try {
      const response = await fetch(`/api/projects/${projectId}/urls/${urlId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast("URLを削除しました", "success");
        router.refresh();
      } else {
        const data = await response.json();
        showToast(`削除に失敗しました: ${data.error || "不明なエラー"}`, "error");
      }
    } catch (error) {
      showToast("削除中にエラーが発生しました", "error");
      console.error("Delete error:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCheck = async (urlId: string) => {
    setCheckingId(urlId);
    try {
      const res = await fetch(`/api/projects/${projectId}/urls/${urlId}/check`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        showToast("チェックを開始しました", "success");
        router.refresh();
      } else {
        showToast(`チェックに失敗しました: ${data?.error || res.statusText}`, "error");
      }
    } catch (err) {
      console.error("Check error", err);
      showToast("チェック呼び出しでエラーが発生しました", "error");
    } finally {
      setCheckingId(null);
    }
  };

  const handleToggleUrl = (urlId: string) => {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(urlId)) {
        next.delete(urlId);
      } else {
        next.add(urlId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedUrls.size === filteredUrls.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(filteredUrls.map((u) => u.id)));
    }
  };

  const handleBulkCheck = async () => {
    if (selectedUrls.size === 0) {
      showToast("チェックするURLを選択してください", "info");
      return;
    }

    setBulkChecking(true);
    const urlIds = Array.from(selectedUrls);
    const results = await Promise.allSettled(
      urlIds.map((urlId) =>
        fetch(`/api/projects/${projectId}/urls/${urlId}/check`, {
          method: "POST",
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - succeeded;

    if (failed === 0) {
      showToast(`${succeeded}件のチェックを開始しました`, "success");
    } else if (succeeded === 0) {
      showToast(`すべてのチェックが失敗しました (${failed}件)`, "error");
    } else {
      showToast(`${succeeded}件成功、${failed}件失敗`, "info");
    }

    setSelectedUrls(new Set());
    setBulkChecking(false);
    router.refresh();
  };

  const filteredUrls = searchQuery
    ? initialUrls.filter(
        (row) =>
          row.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (row.note ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : initialUrls;

  const isAllSelected = filteredUrls.length > 0 && selectedUrls.size === filteredUrls.length;
  const isIndeterminate = selectedUrls.size > 0 && selectedUrls.size < filteredUrls.length;

  return (
    <div>
      <header className="header">
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>プロジェクト</div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{projectName} / URL一覧</h1>
        </div>
        <div className="stack">
          <button
            className="button ghost"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="一覧を更新"
            title="最新の情報に更新"
          >
            <ButtonSpinner loading={refreshing}>
              <RotateCw size={16} style={refreshing ? { animation: "spin 1s linear infinite" } : undefined} />
              更新
            </ButtonSpinner>
          </button>
          <button className="button ghost" aria-label="フィルタを開く">
            <SlidersHorizontal size={16} />
            フィルタ
          </button>
          <button
            className="button primary"
            onClick={handleBulkCheck}
            disabled={selectedUrls.size === 0 || bulkChecking}
            aria-label="選択したURLを手動チェック"
          >
            <ButtonSpinner loading={bulkChecking}>
              <PlayCircle size={16} />
              {selectedUrls.size > 0 ? `選択を手動チェック (${selectedUrls.size})` : "選択を手動チェック"}
            </ButtonSpinner>
          </button>
        </div>
      </header>

      <main className="main">
        <section className="card" style={{ paddingBottom: 6 }} aria-labelledby="url-list-heading">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <label htmlFor="url-search" className="visually-hidden">URLを検索</label>
              <input
                id="url-search"
                type="search"
                placeholder="URL / タグ / メモで検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="URL、タグ、メモで検索"
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "10px 12px 10px 36px",
                  color: "var(--text)",
                }}
              />
              <Search size={16} style={{ position: "absolute", left: 12, top: 10, color: "var(--muted)" }} aria-hidden="true" />
            </div>
            <button className="button" onClick={() => setIsModalOpen(true)} aria-label="新しいURLを追加">
              <Plus size={16} aria-hidden="true" />
              新規URL追加
            </button>
          </div>

          <table className="table" role="table" aria-label="監視URL一覧">
            <thead>
              <tr>
                <th scope="col" style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleToggleAll}
                    aria-label="すべて選択"
                  />
                </th>
                <th scope="col">URL</th>
                <th scope="col" style={{ width: 140 }}>最新話</th>
                <th scope="col">タグ</th>
                <th scope="col">Status</th>
                <th scope="col">Response</th>
                <th scope="col">最終チェック</th>
                <th scope="col" style={{ width: 100, textAlign: "right" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUrls.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                    {searchQuery ? "検索結果がありません" : "URLがまだ登録されていません。「新規URL追加」から追加してください。"}
                  </td>
                </tr>
              ) : (
                filteredUrls.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUrls.has(row.id)}
                        onChange={() => handleToggleUrl(row.id)}
                        aria-label={`${row.url}を選択`}
                      />
                    </td>
                    <td data-label="URL">
                      {(() => {
                        const parts = parseUrlParts(row.url);
                        return (
                          <div className="url-row">
                            <Link href={`/projects/${projectId}/urls/${row.id}`} className="url-chip">
                              <div className="url-chip__domain">{parts.domain}</div>
                              {parts.path ? <div className="url-chip__path">{parts.path}</div> : null}
                            </Link>
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${row.url} を開く`}
                              title="URLを新しいタブで開く"
                              className="url-open-btn"
                            >
                              <ExternalLink size={18} />
                            </a>
                          </div>
                        );
                      })()}
                      {row.note ? <div className="url-note">{row.note}</div> : null}
                    </td>
                    <td data-label="最新話" className="mono">{row.latestEpisode ?? "-"}</td>
                    <td data-label="タグ" className="stack">
                      {row.tags.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </td>
                    <td data-label="Status">
                      <StatusPill status={row.status} />
                    </td>
                    <td data-label="Response" className="mono">{row.latency ? `${row.latency}ms` : "-"}</td>
                    <td data-label="最終チェック">{row.checked}</td>
                    <td data-label="操作">
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                        <button
                          onClick={() => handleCheck(row.id)}
                          disabled={checkingId === row.id}
                          aria-label="チェック実行"
                          className="action-button primary"
                        >
                          <ButtonSpinner loading={checkingId === row.id}>
                            <RefreshCw size={14} />
                            <span className="action-button-text">チェック</span>
                          </ButtonSpinner>
                        </button>

                        <DropdownMenu trigger={<MoreVertical size={18} />}>
                          <DropdownItem
                            icon={<ExternalLink size={16} />}
                            onClick={() => window.open(`/projects/${projectId}/urls/${row.id}`, "_self")}
                          >
                            詳細を見る
                          </DropdownItem>
                          <DropdownItem
                            icon={<Edit2 size={16} />}
                            onClick={() => {
                              // TODO: 編集モーダルを開く
                              showToast("編集機能は近日実装予定です", "info");
                            }}
                          >
                            編集
                          </DropdownItem>
                          <DropdownItem
                            icon={<FolderInput size={16} />}
                            onClick={() => setMoveModalUrl({ id: row.id, url: row.url })}
                          >
                            別プロジェクトに移動
                          </DropdownItem>
                          <DropdownDivider />
                          <DropdownItem
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDelete(row.id, row.url)}
                            danger
                            disabled={deletingId === row.id}
                          >
                            {deletingId === row.id ? "削除中..." : "削除"}
                          </DropdownItem>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>

      <AddUrlModal
        projectId={projectId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {moveModalUrl && (
        <MoveUrlModal
          isOpen={true}
          onClose={() => setMoveModalUrl(null)}
          onSuccess={() => {
            setMoveModalUrl(null);
            router.refresh();
          }}
          currentProjectId={projectId}
          urlId={moveModalUrl.id}
          urlText={moveModalUrl.url}
        />
      )}

      <style jsx>{`
        .url-row {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--background-secondary);
        }
        .url-chip {
          display: grid;
          grid-template-columns: auto 1fr;
          column-gap: 8px;
          row-gap: 2px;
          align-items: center;
          padding: 10px 12px;
          flex: 1;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
          text-decoration: none;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.25);
          transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          min-width: 0;
        }
        .url-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.32);
          border-color: rgba(140, 240, 179, 0.4);
        }
        .url-chip__domain {
          color: var(--text);
          font-weight: 600;
          letter-spacing: -0.01em;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .url-chip__path {
          color: var(--muted);
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .url-open-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.04);
          color: var(--muted);
          transition: all 0.18s ease;
          flex-shrink: 0;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
        }
        .url-open-btn:hover {
          color: var(--text);
          border-color: rgba(140, 240, 179, 0.4);
          background: rgba(140, 240, 179, 0.08);
          transform: translateY(-1px);
        }
        .url-note {
          margin-top: 8px;
          padding: 10px 12px;
          font-size: 12px;
          line-height: 1.5;
          color: var(--text);
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        @media (max-width: 720px) {
          .url-row {
            flex-direction: column;
            align-items: stretch;
          }
          .url-open-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
