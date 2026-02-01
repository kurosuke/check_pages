"use client";

import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/components/ui/toast";
import { ButtonSpinner } from "@/app/components/ui/spinner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      setLoading(false);
    };
    checkSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      showToast("パスワードは6文字以上で入力してください", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("パスワードが一致しません", "error");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        showToast(`エラー: ${error.message}`, "error");
      } else {
        showToast("パスワードを更新しました", "success");
        router.push("/settings");
      }
    } catch {
      showToast("パスワードの更新に失敗しました", "error");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px" }}>
        <div style={{ textAlign: "center" }}>
          <ButtonSpinner loading={true}>読み込み中...</ButtonSpinner>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <h1 style={{ marginBottom: 16 }}>ログインが必要です</h1>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>
          パスワードを変更するにはログインしてください。
        </p>
        <Link href="/login" className="btn btn-primary">
          ログインページへ
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ textAlign: "center", marginBottom: 32 }}>パスワードを変更</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: 8, fontSize: 14, color: "var(--muted)" }}
          >
            新しいパスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6文字以上"
            required
            minLength={6}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--foreground)",
              fontSize: 14,
            }}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label
            htmlFor="confirmPassword"
            style={{ display: "block", marginBottom: 8, fontSize: 14, color: "var(--muted)" }}
          >
            パスワード確認
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="もう一度入力"
            required
            minLength={6}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--card)",
              color: "var(--foreground)",
              fontSize: 14,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href="/settings"
            className="btn btn-secondary"
            style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
          >
            キャンセル
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={updating}
            style={{ flex: 1 }}
          >
            <ButtonSpinner loading={updating}>
              変更する
            </ButtonSpinner>
          </button>
        </div>
      </form>
    </div>
  );
}
