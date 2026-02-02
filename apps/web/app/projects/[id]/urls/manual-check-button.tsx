"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { useToast } from "@/app/components/ui/toast";
import { ButtonSpinner } from "@/app/components/ui/spinner";

type Props = {
  projectId: string;
  urlId: string;
};

export function ManualCheckButton({ projectId, urlId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/urls/${urlId}/check`, {
        method: "POST"
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success !== false) {
        showToast("手動チェックを開始しました", "success");
        router.refresh();
      } else {
        showToast(`チェックに失敗しました: ${data?.error || res.statusText}`, "error");
      }
    } catch (e) {
      showToast("チェック呼び出しでエラーが発生しました", "error");
      console.error("manual check error", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="button" onClick={handleClick} disabled={loading} aria-label="手動チェック">
      <ButtonSpinner loading={loading}>
        <RefreshCcw size={16} />
        手動チェック
      </ButtonSpinner>
    </button>
  );
}
