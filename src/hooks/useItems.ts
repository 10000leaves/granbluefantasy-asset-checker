"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import {
  charactersAtom,
  weaponsAtom,
  summonsAtom,
  selectedCharactersAtom,
  selectedWeaponsAtom,
  selectedSummonsAtom,
} from "@/atoms";
import { fetchWithCache } from "@/lib/utils/apiCache";

interface ItemTag {
  categoryId: string;
  valueId: string;
}

interface Item {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  implementationDate: string;
  tags?: ItemTag[];
}

interface CreateItemParams {
  name: string;
  category: string;
  imageUrl: string;
  implementationDate: string;
  tags?: ItemTag[];
}

interface UpdateItemParams {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  implementationDate: string;
  tags?: ItemTag[];
}

interface UseItemsResult<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  selectedItems: string[];
  setSelectedItems: (ids: string[]) => void;
  toggleItem: (id: string) => void;
  createItem: (item: CreateItemParams) => Promise<Item>;
  updateItem: (item: UpdateItemParams) => Promise<Item>;
  deleteItem: (id: string) => Promise<boolean>;
  refreshItems: () => Promise<void>;
}

export function useItems(category?: string): UseItemsResult<any> {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // カテゴリに応じたアトムを選択
  const [characters, setCharacters] = useAtom(charactersAtom);
  const [weapons, setWeapons] = useAtom(weaponsAtom);
  const [summons, setSummons] = useAtom(summonsAtom);

  const [selectedCharacters, setSelectedCharacters] = useAtom(
    selectedCharactersAtom,
  );
  const [selectedWeapons, setSelectedWeapons] = useAtom(selectedWeaponsAtom);
  const [selectedSummons, setSelectedSummons] = useAtom(selectedSummonsAtom);

  // 管理者画面用の状態（カテゴリが指定されていない場合）
  const [adminItems, setAdminItems] = useState<Item[]>([]);
  const [adminSelectedItems, setAdminSelectedItems] = useState<string[]>([]);

  // カテゴリに応じたアイテムと選択状態を取得
  const getItemsAndSelected = () => {
    switch (category) {
      case "character":
        return {
          items: characters,
          setItems: setCharacters,
          selectedItems: selectedCharacters,
          setSelectedItems: setSelectedCharacters,
        };
      case "weapon":
        return {
          items: weapons,
          setItems: setWeapons,
          selectedItems: selectedWeapons,
          setSelectedItems: setSelectedWeapons,
        };
      case "summon":
        return {
          items: summons,
          setItems: setSummons,
          selectedItems: selectedSummons,
          setSelectedItems: setSelectedSummons,
        };
      default:
        // カテゴリが指定されていない場合は管理者画面用の状態を返す
        return {
          items: adminItems,
          setItems: setAdminItems,
          selectedItems: adminSelectedItems,
          setSelectedItems: setAdminSelectedItems,
        };
    }
  };

  const { items, setItems, selectedItems, setSelectedItems } =
    getItemsAndSelected();

  const fetchItems = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // キャッシュキーを生成
      const cacheKey = category ? `items_${category}` : "items_all";
      
      // カテゴリが指定されていない場合は全てのカテゴリのアイテムを取得
      const url = category ? `/api/items?category=${category}` : "/api/items";
      
      // キャッシュを使用してデータを取得
      const data = await fetchWithCache(
        cacheKey,
        async () => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Failed to fetch items");
          }
          return await response.json();
        },
        30 * 60 * 1000, // 30分キャッシュ
        forceRefresh
      );
      
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category]);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => {
      // 安全に処理
      const prevItems = prev || [];
      return prevItems.includes(id)
        ? prevItems.filter((itemId) => itemId !== id)
        : [...prevItems, id];
    });
  };

  const createItem = async (item: CreateItemParams): Promise<Item> => {
    try {
      setLoading(true);
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error("Failed to create item");
      }

      const newItem = await response.json();
      // @ts-ignore - 型の互換性を無視
      setItems((prev) => [...prev, newItem]);
      
      // キャッシュを更新
      await fetchItems(true);
      
      return newItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (item: UpdateItemParams): Promise<Item> => {
    try {
      setLoading(true);
      const response = await fetch("/api/items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      const updatedItem = await response.json();
      // @ts-ignore - 型の互換性を無視
      setItems((prev) =>
        // @ts-ignore - 型の互換性を無視
        prev.map((i) => (i.id === item.id ? updatedItem : i)),
      );
      
      // キャッシュを更新
      await fetchItems(true);
      
      return updatedItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/items?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // @ts-ignore - 型の互換性を無視
      setItems((prev) => prev.filter((item) => item.id !== id));
      
      // キャッシュを更新
      await fetchItems(true);
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const refreshItems = async (): Promise<void> => {
    await fetchItems(true);
  };

  return {
    items,
    loading,
    error,
    selectedItems: selectedItems || [], // 安全に返す
    setSelectedItems,
    toggleItem,
    createItem,
    updateItem,
    deleteItem,
    refreshItems,
  };
}
