import "./globals.css";
import { Sidebar } from "./components/sidebar";
import { SupabaseProvider } from "./supabase-provider";
import { ToastProvider } from "./components/ui/toast";
import { createServerSupabase } from "./lib/supabase/server";

export const metadata = {
  title: "Check Pages",
  description: "Website change & uptime monitor dashboard"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return (
    <html lang="ja">
      <body>
        <SupabaseProvider initialSession={session}>
          <ToastProvider>
            <div className="layout">
              <Sidebar />
              <div className="content">{children}</div>
            </div>
          </ToastProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
