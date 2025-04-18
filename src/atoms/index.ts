'use client';

import { atom } from 'jotai';

// 型定義
export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  element?: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  rarity?: 'SSR' | 'SR' | 'R';
  tags?: any[];
}

export interface Weapon {
  id: string;
  name: string;
  imageUrl: string;
  element?: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  weaponType?: string;
  rarity?: 'SSR' | 'SR' | 'R';
  tags?: any[];
  count?: number;
}

export interface Summon {
  id: string;
  name: string;
  imageUrl: string;
  element?: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  rarity?: 'SSR' | 'SR' | 'R';
  tags?: any[];
}

export interface InputItem {
  id: string;
  name: string;
  type: string;
  order_index: number;
  required: boolean;
  default_value: string | null;
}

export interface InputGroup {
  group_id: string;
  group_name: string;
  group_order: number;
  items: InputItem[];
}

// アトム定義
export const charactersAtom = atom<Character[]>([]);
export const weaponsAtom = atom<Weapon[]>([]);
export const summonsAtom = atom<Summon[]>([]);

export const selectedCharactersAtom = atom<string[]>([]);
export const selectedWeaponsAtom = atom<string[]>([]);
export const selectedSummonsAtom = atom<string[]>([]);

export const weaponCountsAtom = atom<Record<string, number>>({});

export const inputGroupsAtom = atom<InputGroup[]>([]);
export const inputValuesAtom = atom<Record<string, any>>({});

// テーマ設定用アトム
export const themeTypeAtom = atom<'light' | 'dark' | 'system'>('system');

// 派生アトム
export const selectedCharacterItemsAtom = atom((get) => {
  const characters = get(charactersAtom);
  const selectedIds = get(selectedCharactersAtom);
  return characters.filter(char => selectedIds.includes(char.id));
});

export const selectedWeaponItemsAtom = atom((get) => {
  const weapons = get(weaponsAtom);
  const selectedIds = get(selectedWeaponsAtom);
  return weapons.filter(weapon => selectedIds.includes(weapon.id));
});

export const selectedSummonItemsAtom = atom((get) => {
  const summons = get(summonsAtom);
  const selectedIds = get(selectedSummonsAtom);
  return summons.filter(summon => selectedIds.includes(summon.id));
});

// ローカルストレージ永続化のためのヘルパー関数
export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const saveToLocalStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};
