"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, PlayCircle, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/app/components/status-pill";
import { AddUrlModal } from "@/app/components/add-url-modal";
import { useRouter } from "next/navigation";

interface UrlRow {
  id: string;
  url: string;
  tags: string[];
  status: "ok" | "changed" | "error";
  http: number;
  latency: number;
  checked: string;
  diff: string;
}

interface UrlListClientProps {
  projectId: string;
  initialUrls: UrlRow[];
}

export function UrlListClient({ projectId, initialUrls }: UrlListClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

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
        router.refresh();
      } else {
        const data = await response.json();
        alert(`削除に失敗しました: ${data.error || "不明なエラー"}`);
      }
    } catch (error) {
      alert("削除中にエラーが発生しました");
      console.error("Delete error:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUrls = searchQuery
    ? initialUrls.filter(
        (row) =>
          row.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : initialUrls;

  return (
    <div>
      <header className="header">
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>プロジェクト</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Project {projectId} / URL一覧</div>
        </div>
        <div className="stack">
          <button className="button ghost">
            <SlidersHorizontal size={16} />
            フィルタ
          </button>
          <button className="button ghost">
            <PlayCircle size={16} />
            選択を手動チェック
          </button>
        </div>
      </header>

      <main className="main">
        <div className="card" style={{ paddingBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                placeholder="URL / タグ / メモで検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "10px 12px 10px 36px",
                  color: "var(--text)",
                }}
              />
              <Search size={16} style={{ position: "absolute", left: 12, top: 10, color: "var(--muted)" }} />
            </div>
            <button className="button" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} />
              新規URL追加
            </button>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input type="checkbox" />
                </th>
                <th>URL</th>
                <th>タグ</th>
                <th>Status</th>
                <th>HTTP</th>
                <th>Response</th>
                <th>最終チェック</th>
                <th>差分</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUrls.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
                    {searchQuery ? "検索結果がありません" : "URLがまだ登録されていません。「新規URL追加」から追加してください。"}
                  </td>
                </tr>
              ) : (
                filteredUrls.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <Link href={`/projects/${projectId}/urls/${row.id}`} style={{ fontWeight: 600 }}>
                        {row.url}
                      </Link>
                    </td>
                    <td className="stack">
                      {row.tags.map((t) => (
                        <span key={t} className="tag">
                          {t}
                        </span>
                      ))}
                    </td>
                    <td>
                      <StatusPill status={row.status} />
                    </td>
                    <td className="mono">{row.http || "-"}</td>
                    <td className="mono">{row.latency ? `${row.latency}ms` : "-"}</td>
                    <td>{row.checked}</td>
                    <td>
                      <span className="badge">{row.diff}</span>
                    </td>
                    <td>
                      <div className="stack">
                        <Link className="badge" href={`/projects/${projectId}/urls/${row.id}`}>
                          詳細
                        </Link>
                        <button className="badge">チェック</button>
                        <button
                          className="badge danger"
                          onClick={() => handleDelete(row.id, row.url)}
                          disabled={deletingId === row.id}
                          title="削除"
                        >
                          {deletingId === row.id ? "..." : <Trash2 size={12} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
