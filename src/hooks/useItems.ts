'use client';

import { useState, useEffect } from 'react';

interface ItemTag {
  categoryId: string;
  valueId: string;
}

interface Item {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  tags?: ItemTag[];
}

interface CreateItemParams {
  name: string;
  category: string;
  imageUrl: string;
  tags?: ItemTag[];
}

interface UpdateItemParams {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  tags?: ItemTag[];
}

interface UseItemsResult {
  items: Item[];
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

export function useItems(category?: string): UseItemsResult {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const url = category ? `/api/items?category=${category}` : '/api/items';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      const data = await response.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category]);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  };

  const createItem = async (item: CreateItemParams): Promise<Item> => {
    try {
      setLoading(true);
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error('Failed to create item');
      }

      const newItem = await response.json();
      setItems((prev) => [...prev, newItem]);
      return newItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (item: UpdateItemParams): Promise<Item> => {
    try {
      setLoading(true);
      const response = await fetch('/api/items', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      const updatedItem = await response.json();
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? updatedItem : i))
      );
      return updatedItem;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
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
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const refreshItems = async (): Promise<void> => {
    await fetchItems();
  };

  return {
    items,
    loading,
    error,
    selectedItems,
    setSelectedItems,
    toggleItem,
    createItem,
    updateItem,
    deleteItem,
    refreshItems,
  };
}
