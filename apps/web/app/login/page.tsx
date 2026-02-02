"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const isSignupDisabled = process.env.NEXT_PUBLIC_DISABLE_SIGNUP === "true";

export default function LoginPage() {
  const supabase = useSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") router.push("/");
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px" }}>
      <h1 style={{ textAlign: "center" }}>Sign in</h1>
      {isSignupDisabled && (
        <p style={{ textAlign: "center", color: "#888", marginBottom: 16 }}>
          新規登録は現在停止しています
        </p>
      )}
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={["github", "google"]}
        theme="dark"
        view={isSignupDisabled ? "sign_in" : undefined}
        showLinks={!isSignupDisabled}
        redirectTo={typeof window !== "undefined" ? `${window.location.origin}/` : undefined}
      />
    </div>
  );
}
