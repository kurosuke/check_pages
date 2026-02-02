"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: { id: string; name: string }) => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      // Reset form
      setName("");
      
      onSuccess(data.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: 18 }}>新規プロジェクト作成</h2>
          <button className="icon-button" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="projectName">プロジェクト名 *</label>
            <input
              id="projectName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="プロジェクト名を入力"
              required
              maxLength={100}
              className="form-input"
            />
            <p className="form-hint">チェック対象のURLをグループ化するプロジェクト名</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="button ghost" onClick={onClose} disabled={loading}>
              キャンセル
            </button>
            <button type="submit" className="button" disabled={loading || !name.trim()}>
              {loading ? "作成中..." : "プロジェクトを作成"}
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
        .modal-content {
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
          font-size: 20px;
          font-weight: 600;
          color: var(--text);
        }
        .icon-button {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.15s;
        }
        .icon-button:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.08);
        }
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }
        .form-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 10px;
          padding: 10px 12px;
          color: var(--text);
          font-size: 14px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-input:focus {
          outline: none;
          border-color: rgba(140, 240, 179, 0.5);
          box-shadow: 0 0 0 3px rgba(140, 240, 179, 0.18);
        }
        .form-input:hover {
          border-color: rgba(255, 255, 255, 0.28);
        }
        .form-hint {
          margin-top: 8px;
          font-size: 12px;
          color: var(--muted);
          line-height: 1.5;
        }
        .error-message {
          background: rgba(248, 113, 113, 0.15);
          border: 1px solid rgba(248, 113, 113, 0.5);
          color: var(--error);
          padding: 12px 14px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.14);
        }
      `}</style>
    </div>
  );
}
