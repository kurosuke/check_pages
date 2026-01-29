"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, PlayCircle, Plus, Trash2, MoreVertical, ExternalLink, RefreshCw, Edit2 } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/app/components/status-pill";
import { AddUrlModal } from "@/app/components/add-url-modal";
import { useToast } from "@/app/components/ui/toast";
import { ButtonSpinner } from "@/app/components/ui/spinner";
import { DropdownMenu, DropdownItem, DropdownDivider } from "@/app/components/ui/dropdown-menu";
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

export function UrlListClient({ projectId, projectName, initialUrls }: UrlListClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [bulkChecking, setBulkChecking] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

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
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Link
                          href={`/projects/${projectId}/urls/${row.id}`}
                          style={{
                            fontWeight: 500,
                            flex: 1,
                            color: "var(--info)",
                            textDecoration: "none",
                            wordBreak: "break-all",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                          onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                        >
                          {row.url}
                        </Link>
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${row.url} を開く`}
                          title="URLを新しいタブで開く"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                            background: "#fff",
                            color: "var(--muted)",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f7fafa";
                            e.currentTarget.style.color = "var(--text)";
                            e.currentTarget.style.borderColor = "var(--info)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fff";
                            e.currentTarget.style.color = "var(--muted)";
                            e.currentTarget.style.borderColor = "var(--border)";
                          }}
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                      {row.note ? (
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
                          {row.note}
                        </div>
                      ) : null}
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
    </div>
  );
}
