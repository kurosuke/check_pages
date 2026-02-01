"use client";

import { createClient } from "@/app/lib/supabase/client";
import { ButtonSpinner } from "@/app/components/ui/spinner";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

export default function GlobalSettings() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 64 }}>
        <ButtonSpinner loading={true}>読み込み中...</ButtonSpinner>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>全体設定</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>アカウント & API</div>
        </div>
      </header>
      <main className="main">
        <div className="card">
          <div className="section-title">
            <h2>ユーザー情報</h2>
          </div>
          <div className="grid-two">
            <div className="panel">
              <div style={{ color: "var(--muted)", fontSize: 12 }}>メールアドレス</div>
              <div>{user?.email ?? "未ログイン"}</div>
            </div>
            <div className="panel">
              <div style={{ color: "var(--muted)", fontSize: 12 }}>ユーザーID</div>
              <div className="mono" style={{ fontSize: 12 }}>{user?.id ?? "-"}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <h2>セキュリティ</h2>
          </div>
          <div className="panel">
            <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>パスワード変更</div>
            <Link
              href="/settings/update-password"
              className="btn btn-secondary"
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              パスワードを変更する
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="section-title">
            <h2>Supabase 接続</h2>
            <span className="badge">サービス版</span>
          </div>
          <div className="grid-two">
            <div className="panel">
              <div style={{ color: "var(--muted)", fontSize: 12 }}>SUPABASE_URL</div>
              <div className="mono">https://your-project.supabase.co</div>
            </div>
            <div className="panel">
              <div style={{ color: "var(--muted)", fontSize: 12 }}>ANON_KEY</div>
              <div className="mono">••••••••••</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
