"use client";

import { useLocalStorage } from "@/hooks/useLocalStorage";

export function LocalStorageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // useLocalStorageフックを呼び出して、ローカルストレージからデータを読み込む
  useLocalStorage();

  // 子コンポーネントをそのまま返す
  return <>{children}</>;
}
