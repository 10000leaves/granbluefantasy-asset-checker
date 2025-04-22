// ユーティリティ関数

import { InputItem, ItemType } from '../types/models';
import { TagCategory, TagValue } from '@/hooks/useTags';

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

/**
 * 属性の日本語から英語への変換
 */
export const convertElementJaToEn = (jaValue: string): string => {
  switch (jaValue) {
    case '火': return 'fire';
    case '水': return 'water';
    case '土': return 'earth';
    case '風': return 'wind';
    case '光': return 'light';
    case '闇': return 'dark';
    default: return jaValue.toLowerCase();
  }
};

/**
 * 属性の英語から日本語への変換
 */
export const translateElement = (element: string): string => {
  const elementTranslations: { [key: string]: string } = {
    fire: '火',
    water: '水',
    earth: '土',
    wind: '風',
    light: '光',
    dark: '闇',
  };

  return elementTranslations[element] || element;
};

/**
 * タグカテゴリから動的にフィルターキーのマッピングを生成
 * カテゴリIDをキーとして、動的に生成したフィルターキー（a, b, c, ...）を値とするマップを返す
 */
export const createTagCategoryMap = (
  tagCategories: TagCategory[]
): Record<string, string> => {
  const map: Record<string, string> = {};
  
  // 属性カテゴリは特別扱い（UI表示のため）
  const elementCategory = tagCategories.find(c => c.name.toLowerCase() === '属性');
  if (elementCategory) {
    map[elementCategory.id] = 'elements';
  }
  
  // その他のカテゴリには動的にキーを割り当て
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let index = 0;
  
  tagCategories.forEach(category => {
    // 属性カテゴリは既に処理済みなのでスキップ
    if (category.id === elementCategory?.id) return;
    
    // アルファベットの文字を順番に割り当て
    const key = alphabet[index];
    map[category.id] = key;
    index++;
    
    // アルファベットを超える場合は複数文字のキーを生成
    if (index >= alphabet.length) {
      const majorIndex = Math.floor(index / alphabet.length);
      const minorIndex = index % alphabet.length;
      map[category.id] = alphabet[majorIndex - 1] + alphabet[minorIndex];
    }
  });
  
  return map;
};


/**
 * アイテムのタグデータを生成する共通関数
 * カテゴリIDに対応するフィルターキーをキーとして、タグ値の配列を値とするオブジェクトを返す
 */
export const generateItemTagData = (
  item: any,
  tagCategories: TagCategory[],
  tagValueMap: Record<string, { categoryId: string, value: string }>,
  tagCategoryMap: Record<string, string>
): Record<string, string[]> => {
  if (!item.tags) return {};
  
  const tagData: Record<string, string[]> = {};
  
  item.tags.forEach((tag: { categoryId: string, valueId: string }) => {
    const category = tagCategories.find(c => c.id === tag.categoryId);
    if (!category) return;
    
    const tagValue = tagValueMap[tag.valueId]?.value;
    if (!tagValue) return;
    
    // カテゴリに対応するフィルターキーを取得
    const filterKey = tagCategoryMap[category.id];
    if (!filterKey) return;
    
    // フィルターキーに対応するタグ値を追加
    if (!tagData[filterKey]) {
      tagData[filterKey] = [];
    }
    
    // 全てのタグ値を日本語のまま保持
    tagData[filterKey].push(tagValue);
  });
  
  return tagData;
};

/**
 * アイテムの属性とレアリティを取得する共通関数
 */
export const getItemAttributes = (
  item: any,
  tagData: Record<string, string[]>
): { element: string, rarity: string } => {
  // 属性の取得と日本語から英語への変換
  let element = 'fire';
  if (tagData.elements && tagData.elements.length > 0) {
    const jaValue = tagData.elements[0];
    // 日本語から英語への変換
    const enValue = convertElementJaToEn(jaValue);
    element = enValue;
  }
  
  // レアリティの取得
  let rarity = 'SSR';
  if (tagData.rarities && tagData.rarities.length > 0) {
    const rarityValue = tagData.rarities[0].toUpperCase();
    if (rarityValue === 'SSR' || rarityValue === 'SR' || rarityValue === 'R') {
      rarity = rarityValue;
    }
  }
  
  return { element, rarity };
};
