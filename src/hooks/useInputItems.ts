"use client";

import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import {
  inputGroupsAtom,
  inputValuesAtom,
  InputGroup,
  InputItem,
} from "@/atoms";

interface UseInputItemsResult {
  loading: boolean;
  error: string | null;
  inputGroups: InputGroup[];
  inputValues: Record<string, any>;
  setInputValue: (id: string, value: any) => void;
  createGroup: (name: string) => Promise<InputGroup>;
  createItem: (item: {
    name: string;
    type: string;
    required: boolean;
    defaultValue: string | null;
    groupId: string;
  }) => Promise<InputItem>;
  updateItem: (item: {
    id: string;
    name: string;
    type: string;
    required: boolean;
    defaultValue: string | null;
  }) => Promise<InputItem>;
  deleteItem: (id: string) => Promise<boolean>;
  refreshInputGroups: () => Promise<void>;
}

export function useInputItems(): UseInputItemsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputGroups, setInputGroups] = useAtom(inputGroupsAtom);
  const [inputValues, setInputValues] = useAtom(inputValuesAtom);

  // 入力グループと項目を取得
  const fetchInputGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/input-items");
      if (!response.ok) {
        throw new Error("Failed to fetch input items");
      }

      const data = await response.json();
      setInputGroups(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // 初期読み込み
  useEffect(() => {
    fetchInputGroups();
  }, []);

  // 入力値を設定
  const setInputValue = (id: string, value: any) => {
    setInputValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // グループを作成
  const createGroup = async (name: string): Promise<InputGroup> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/input-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to create input group");
      }

      const newGroup = await response.json();

      // 新しいグループを追加
      const updatedGroup = {
        group_id: newGroup.id,
        group_name: newGroup.name,
        group_order: newGroup.order_index,
        items: [],
      };

      setInputGroups([...inputGroups, updatedGroup]);

      return updatedGroup;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // 入力項目を作成
  const createItem = async (item: {
    name: string;
    type: string;
    required: boolean;
    defaultValue: string | null;
    groupId: string;
  }): Promise<InputItem> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/input-items/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error("Failed to create input item");
      }

      const newItem = await response.json();

      // 対応するグループに新しい項目を追加
      setInputGroups(
        inputGroups.map((group) => {
          if (group.group_id === item.groupId) {
            return {
              ...group,
              items: [...group.items, newItem],
            };
          }
          return group;
        }),
      );

      return newItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // 入力項目を更新
  const updateItem = async (item: {
    id: string;
    name: string;
    type: string;
    required: boolean;
    defaultValue: string | null;
  }): Promise<InputItem> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/input-items/items", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error("Failed to update input item");
      }

      const updatedItem = await response.json();

      // 対応する項目を更新
      setInputGroups(
        inputGroups.map((group) => {
          return {
            ...group,
            items: group.items.map((i) => {
              if (i.id === item.id) {
                return updatedItem;
              }
              return i;
            }),
          };
        }),
      );

      return updatedItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // 入力項目を削除
  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/input-items/items?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete input item");
      }

      // 対応する項目を削除
      setInputGroups(
        inputGroups.map((group) => {
          return {
            ...group,
            items: group.items.filter((item) => item.id !== id),
          };
        }),
      );

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // 入力グループと項目を再取得
  const refreshInputGroups = async () => {
    await fetchInputGroups();
  };

  return {
    loading,
    error,
    inputGroups,
    inputValues,
    setInputValue,
    createGroup,
    createItem,
    updateItem,
    deleteItem,
    refreshInputGroups,
  };
}
