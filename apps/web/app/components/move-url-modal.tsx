"use client";

import { useState, useEffect } from "react";
import { X, FolderInput } from "lucide-react";
import { ButtonSpinner } from "@/app/components/ui/spinner";
import { useToast } from "@/app/components/ui/toast";

interface Project {
  id: string;
  name: string;
}

interface MoveUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentProjectId: string;
  urlId: string;
  urlText: string;
}

export function MoveUrlModal({
  isOpen,
  onClose,
  onSuccess,
  currentProjectId,
  urlId,
  urlText,
}: MoveUrlModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingProjects, setFetchingProjects] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
      setSelectedProjectId("");
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    setFetchingProjects(true);
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      if (response.ok && data.data) {
        // 現在のプロジェクトを除外
        const otherProjects = data.data.filter(
          (p: Project) => p.id !== currentProjectId
        );
        setProjects(otherProjects);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      showToast("プロジェクト一覧の取得に失敗しました", "error");
    } finally {
      setFetchingProjects(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProjectId) {
      showToast("移動先のプロジェクトを選択してください", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/projects/${currentProjectId}/urls/${urlId}/move`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetProjectId: selectedProjectId }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showToast("URLを移動しました", "success");
        onSuccess();
        onClose();
      } else {
        showToast(`移動に失敗しました: ${data.error || "不明なエラー"}`, "error");
      }
    } catch (error) {
      console.error("Move error:", error);
      showToast("移動中にエラーが発生しました", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="move-url-modal-title"
      >
        <div className="modal-header">
          <h2 id="move-url-modal-title">
            <FolderInput size={20} style={{ marginRight: 8 }} />
            URLを別プロジェクトに移動
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label style={{ color: "var(--muted)", fontSize: 12 }}>
                移動するURL
              </label>
              <div
                className="mono"
                style={{
                  padding: "10px 12px",
                  background: "var(--panel)",
                  borderRadius: 10,
                  fontSize: 13,
                  wordBreak: "break-all",
                  border: "1px solid rgba(255, 255, 255, 0.18)"
                }}
              >
                {urlText}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="target-project">移動先プロジェクト</label>
              {fetchingProjects ? (
                <div style={{ padding: "12px 0", color: "var(--muted)" }}>
                  <ButtonSpinner loading={true}>読み込み中...</ButtonSpinner>
                </div>
              ) : projects.length === 0 ? (
                <div
                  style={{
                    padding: "12px",
                    color: "var(--muted)",
                    background: "var(--background)",
                    borderRadius: 6,
                    fontSize: 13,
                  }}
                >
                  移動先のプロジェクトがありません。先に別のプロジェクトを作成してください。
                </div>
              ) : (
                <select
                  id="target-project"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(255, 255, 255, 0.18)",
                    background: "rgba(255, 255, 255, 0.05)",
                    color: "var(--text)",
                    fontSize: 14,
                  }}
                >
                  <option value="">プロジェクトを選択...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="button ghost"
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="button"
              disabled={loading || !selectedProjectId || projects.length === 0}
            >
              <ButtonSpinner loading={loading}>移動する</ButtonSpinner>
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(8px);
        }
        .modal {
          background: linear-gradient(160deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 28px;
          box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.14);
        }
        .modal-header h2 {
          display: flex;
          align-items: center;
          font-size: 18px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.15s;
        }
        .modal-close:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.08);
        }
        .modal-body {
          margin-bottom: 24px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group:last-child {
          margin-bottom: 0;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.14);
        }
      `}</style>
    </div>
  );
}
