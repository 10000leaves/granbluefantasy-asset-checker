// ユーティリティ関数

import { InputItem, TagCategory, TagValue, ItemType } from '../types/models';

/**
 * UUIDを生成する
 */
export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * 現在のタイムスタンプを取得する
 */
export const getCurrentTimestamp = (): Date => {
  return new Date();
};

/**
 * タグカテゴリをアイテムタイプでフィルタリングする
 */
export const filterTagsByItemType = (
  categories: TagCategory[],
  itemType: ItemType
): TagCategory[] => {
  return categories.filter((category) => category.itemType === itemType);
};

/**
 * タグ値をカテゴリIDでフィルタリングする
 */
export const filterTagValuesByCategoryId = (
  values: TagValue[],
  categoryId: string
): TagValue[] => {
  return values.filter((value) => value.categoryId === categoryId);
};

/**
 * 入力値のバリデーション
 */
export const validateInputValue = (
  value: any,
  inputItem: InputItem
): { isValid: boolean; error?: string } => {
  if (inputItem.required && (value === undefined || value === null || value === '')) {
    return { isValid: false, error: '必須項目です' };
  }

  switch (inputItem.type) {
    case 'number':
      if (value !== '' && isNaN(Number(value))) {
        return { isValid: false, error: '数値を入力してください' };
      }
      break;
    case 'date':
      if (value !== '' && isNaN(Date.parse(value))) {
        return { isValid: false, error: '正しい日付を入力してください' };
      }
      break;
  }

  return { isValid: true };
};

/**
 * 配列を順序で並び替える
 */
export const sortByOrder = <T extends { order: number }>(items: T[]): T[] => {
  return [...items].sort((a, b) => a.order - b.order);
};

/**
 * オブジェクトの配列から特定のキーの値を抽出する
 */
export const pluck = <T, K extends keyof T>(array: T[], key: K): T[K][] => {
  return array.map((item) => item[key]);
};

/**
 * 日付をフォーマットする
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * オブジェクトの配列をIDでインデックス化する
 */
export const indexById = <T extends { id: string }>(
  items: T[]
): { [key: string]: T } => {
  return items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {} as { [key: string]: T });
};

/**
 * 文字列を安全なスラッグに変換する
 */
export const toSlug = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};
