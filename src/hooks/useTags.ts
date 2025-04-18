'use client';

import { useState, useEffect } from 'react';

export interface TagValue {
  id: string;
  categoryId: string;
  category_id: string; // APIレスポンスとの互換性のため
  value: string;
  order_index: number;
}

export interface TagCategory {
  id: string;
  name: string;
  itemType: string;
  item_type: string; // APIレスポンスとの互換性のため
  multipleSelect: boolean;
  multiple_select: boolean; // APIレスポンスとの互換性のため
  required: boolean;
  order_index: number;
}

interface CreateTagCategoryParams {
  name: string;
  itemType: string;
  multipleSelect: boolean;
  required: boolean;
}

interface UpdateTagCategoryParams {
  id: string;
  name: string;
  multipleSelect: boolean;
  required: boolean;
}

interface CreateTagValueParams {
  categoryId: string;
  value: string;
}

interface UpdateTagValueParams {
  id: string;
  value: string;
}

interface UseTagsResult {
  tags: TagCategory[];
  tagCategories: TagCategory[];
  tagValues: TagValue[];
  loading: boolean;
  error: string | null;
  selectedTags: Record<string, string[]>;
  setSelectedTags: (tags: Record<string, string[]>) => void;
  toggleTag: (categoryId: string, value: string) => void;
  clearTags: () => void;
  isTagSelected: (categoryId: string, value: string) => boolean;
  createTagCategory: (category: CreateTagCategoryParams) => Promise<TagCategory>;
  updateTagCategory: (category: UpdateTagCategoryParams) => Promise<TagCategory>;
  deleteTagCategory: (id: string) => Promise<boolean>;
  createTagValue: (value: CreateTagValueParams) => Promise<TagValue>;
  updateTagValue: (value: UpdateTagValueParams) => Promise<TagValue>;
  deleteTagValue: (id: string) => Promise<boolean>;
  refreshTags: () => Promise<void>;
}

export function useTags(itemType?: string): UseTagsResult {
  const [tags, setTags] = useState<TagCategory[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [tagValues, setTagValues] = useState<TagValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>({});

  const fetchTags = async () => {
    try {
      setLoading(true);

      // タグカテゴリを取得
      const categoryUrl = itemType ? `/api/tags?itemType=${itemType}` : '/api/tags';
      const categoryResponse = await fetch(categoryUrl);
      if (!categoryResponse.ok) {
        throw new Error('Failed to fetch tag categories');
      }
      const categoryData = await categoryResponse.json();
      
      // APIレスポンスのフィールド名を標準化
      const normalizedCategories = categoryData.map((category: any) => ({
        ...category,
        itemType: category.item_type,
        multipleSelect: category.multiple_select,
      }));
      
      setTagCategories(normalizedCategories);

      // タグ値を取得
      const valueResponse = await fetch('/api/tags/values');
      if (!valueResponse.ok) {
        throw new Error('Failed to fetch tag values');
      }
      const valueData = await valueResponse.json();
      
      // APIレスポンスのフィールド名を標準化
      const normalizedValues = valueData.map((value: any) => ({
        ...value,
        categoryId: value.category_id,
      }));
      
      setTagValues(normalizedValues);

      // タグカテゴリとタグ値を結合
      const tagsWithValues = normalizedCategories.map((category: TagCategory) => ({
        ...category,
        values: normalizedValues.filter((value: TagValue) => value.categoryId === category.id),
      }));
      setTags(tagsWithValues);

      setError(null);

      // 初期の選択状態を設定
      const initialSelectedTags: Record<string, string[]> = {};
      normalizedCategories.forEach((category: TagCategory) => {
        initialSelectedTags[category.id] = [];
      });
      setSelectedTags(initialSelectedTags);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [itemType]);

  const toggleTag = (categoryId: string, value: string) => {
    setSelectedTags((prev) => {
      const category = tagCategories.find((t) => t.id === categoryId);
      if (!category) return prev;

      const currentValues = prev[categoryId] || [];
      let newValues: string[];

      if (category.multipleSelect) {
        // 複数選択可能な場合
        newValues = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value];
      } else {
        // 単一選択の場合
        newValues = currentValues.includes(value) ? [] : [value];
      }

      return {
        ...prev,
        [categoryId]: newValues,
      };
    });
  };

  const clearTags = () => {
    const clearedTags: Record<string, string[]> = {};
    tagCategories.forEach((category) => {
      clearedTags[category.id] = [];
    });
    setSelectedTags(clearedTags);
  };

  const isTagSelected = (categoryId: string, value: string): boolean => {
    return (selectedTags[categoryId] || []).includes(value);
  };

  const createTagCategory = async (category: CreateTagCategoryParams): Promise<TagCategory> => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error('Failed to create tag category');
      }

      const newCategory = await response.json();
      
      // APIレスポンスのフィールド名を標準化
      const normalizedCategory = {
        ...newCategory,
        itemType: newCategory.item_type,
        multipleSelect: newCategory.multiple_select,
      };
      
      setTagCategories((prev) => [...prev, normalizedCategory]);

      // 選択状態を更新
      setSelectedTags((prev) => ({
        ...prev,
        [normalizedCategory.id]: [],
      }));

      return normalizedCategory;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateTagCategory = async (category: UpdateTagCategoryParams): Promise<TagCategory> => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error('Failed to update tag category');
      }

      const updatedCategory = await response.json();
      
      // APIレスポンスのフィールド名を標準化
      const normalizedCategory = {
        ...updatedCategory,
        itemType: updatedCategory.item_type,
        multipleSelect: updatedCategory.multiple_select,
      };
      
      setTagCategories((prev) =>
        prev.map((c) => (c.id === category.id ? normalizedCategory : c))
      );

      return normalizedCategory;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTagCategory = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tags?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag category');
      }

      setTagCategories((prev) => prev.filter((c) => c.id !== id));

      // 選択状態を更新
      setSelectedTags((prev) => {
        const newSelectedTags = { ...prev };
        delete newSelectedTags[id];
        return newSelectedTags;
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const createTagValue = async (value: CreateTagValueParams): Promise<TagValue> => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags/values', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        throw new Error('Failed to create tag value');
      }

      const newValue = await response.json();
      
      // APIレスポンスのフィールド名を標準化
      const normalizedValue = {
        ...newValue,
        categoryId: newValue.category_id,
      };
      
      setTagValues((prev) => [...prev, normalizedValue]);

      return normalizedValue;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateTagValue = async (value: UpdateTagValueParams): Promise<TagValue> => {
    try {
      setLoading(true);
      const response = await fetch('/api/tags/values', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        throw new Error('Failed to update tag value');
      }

      const updatedValue = await response.json();
      
      // APIレスポンスのフィールド名を標準化
      const normalizedValue = {
        ...updatedValue,
        categoryId: updatedValue.category_id,
      };
      
      setTagValues((prev) =>
        prev.map((v) => (v.id === value.id ? normalizedValue : v))
      );

      return normalizedValue;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTagValue = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tags/values?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete tag value');
      }

      setTagValues((prev) => prev.filter((v) => v.id !== id));

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const refreshTags = async (): Promise<void> => {
    await fetchTags();
  };

  return {
    tags,
    tagCategories,
    tagValues,
    loading,
    error,
    selectedTags,
    setSelectedTags,
    toggleTag,
    clearTags,
    isTagSelected,
    createTagCategory,
    updateTagCategory,
    deleteTagCategory,
    createTagValue,
    updateTagValue,
    deleteTagValue,
    refreshTags,
  };
}
