import { useState, useMemo } from "react";

/**
 * 所持アイテムのみを表示するフィルターのためのカスタムフック
 * @param items フィルタリング対象のアイテム配列
 * @param selectedItemIds 所持（選択済み）アイテムのID配列
 * @param filterFn 追加のフィルター条件を適用する関数（オプション）
 * @returns フィルター関連の状態と関数
 */
export function useOwnedFilter<T extends { id: string }>(
  items: T[],
  selectedItemIds: string[],
  filterFn?: (item: T) => boolean,
) {
  // 所持のみフィルターの状態
  const [ownedOnly, setOwnedOnly] = useState(false);

  // フィルター処理
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 所持のみフィルター
      if (ownedOnly && !selectedItemIds.includes(item.id)) {
        return false;
      }

      // 追加のフィルター条件があれば適用
      if (filterFn && !filterFn(item)) {
        return false;
      }

      return true;
    });
  }, [items, ownedOnly, selectedItemIds, filterFn]);

  return {
    ownedOnly,
    setOwnedOnly,
    filteredItems,
  };
}
