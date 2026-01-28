"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

interface Keyword {
  phrase: string;
  must_exist: boolean;
}

interface AddUrlModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUrlModal({ projectId, isOpen, onClose, onSuccess }: AddUrlModalProps) {
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [note, setNote] = useState("");
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [checkInterval, setCheckInterval] = useState(30);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && trimmed.length <= 20 && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddKeyword = () => {
    setKeywords([...keywords, { phrase: "", must_exist: true }]);
  };

  const handleUpdateKeyword = (index: number, field: keyof Keyword, value: string | boolean) => {
    const updated = [...keywords];
    updated[index] = { ...updated[index], [field]: value };
    setKeywords(updated);
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          tags,
          note: note || undefined,
          expected_status: expectedStatus,
          check_interval_minutes: checkInterval,
          keywords: keywords.filter((kw) => kw.phrase.trim() !== ""),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create URL");
      }

      // Reset form
      setUrl("");
      setTags([]);
      setTagInput("");
      setNote("");
      setExpectedStatus(200);
      setCheckInterval(30);
      setKeywords([]);
      
      onSuccess();
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
          <h2 style={{ margin: 0, fontSize: 18 }}>新規URL追加</h2>
          <button className="icon-button" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="url">URL *</label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>タグ</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="タグを入力（20文字以内）"
                maxLength={20}
                className="form-input"
                style={{ flex: 1 }}
              />
              <button type="button" className="button ghost" onClick={handleAddTag}>
                追加
              </button>
            </div>
            {tags.length > 0 && (
              <div className="tag-list">
                {tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove"
                      aria-label={`${tag}を削除`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="note">メモ</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="このURLについてのメモ"
              className="form-input"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expectedStatus">期待ステータス</label>
              <input
                id="expectedStatus"
                type="number"
                value={expectedStatus}
                onChange={(e) => setExpectedStatus(Number(e.target.value))}
                min={100}
                max={599}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="checkInterval">チェック頻度（分）</label>
              <input
                id="checkInterval"
                type="number"
                value={checkInterval}
                onChange={(e) => setCheckInterval(Number(e.target.value))}
                min={5}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>キーワード監視</label>
            {keywords.map((kw, index) => (
              <div key={index} className="keyword-row">
                <input
                  type="text"
                  value={kw.phrase}
                  onChange={(e) => handleUpdateKeyword(index, "phrase", e.target.value)}
                  placeholder="監視するキーワード"
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={kw.must_exist}
                    onChange={(e) => handleUpdateKeyword(index, "must_exist", e.target.checked)}
                  />
                  {kw.must_exist ? "存在必須" : "存在NG"}
                </label>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => handleRemoveKeyword(index)}
                  aria-label="キーワードを削除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button type="button" className="button ghost" onClick={handleAddKeyword}>
              <Plus size={16} />
              キーワードを追加
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="button ghost" onClick={onClose} disabled={loading}>
              キャンセル
            </button>
            <button type="submit" className="button" disabled={loading}>
              {loading ? "追加中..." : "URL を追加"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: var(--card);
          border-radius: 12px;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .icon-button {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
        }
        .icon-button:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.1);
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          color: var(--muted);
        }
        .form-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          color: var(--text);
          font-size: 14px;
        }
        .form-input:focus {
          outline: none;
          border-color: var(--info);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .tag-remove {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          margin-left: 4px;
          padding: 0;
          display: inline-flex;
          align-items: center;
        }
        .keyword-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .toggle-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          white-space: nowrap;
          color: var(--muted);
        }
        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--error);
          color: var(--error);
          padding: 10px 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
      `}</style>
    </div>
  );
}
