"use client";

// APIレスポンスをキャッシュするためのユーティリティ

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry?: number; // キャッシュの有効期限（ミリ秒）
}

// キャッシュのデータ型
interface Cache {
  [key: string]: CacheItem<any>;
}

// グローバルキャッシュオブジェクト
const globalCache: Cache = {};

// デフォルトのキャッシュ有効期限（5分）
const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * キャッシュからデータを取得する
 * @param key キャッシュキー
 * @returns キャッシュされたデータ、または undefined（キャッシュがない場合）
 */
export function getFromCache<T>(key: string): T | undefined {
  const cacheItem = globalCache[key];
  
  // キャッシュが存在しない場合
  if (!cacheItem) {
    return undefined;
  }
  
  // キャッシュの有効期限をチェック
  if (cacheItem.expiry && Date.now() - cacheItem.timestamp > cacheItem.expiry) {
    // キャッシュが期限切れの場合は削除
    delete globalCache[key];
    return undefined;
  }
  
  return cacheItem.data;
}

/**
 * データをキャッシュに保存する
 * @param key キャッシュキー
 * @param data 保存するデータ
 * @param expiry キャッシュの有効期限（ミリ秒）
 */
export function saveToCache<T>(key: string, data: T, expiry = DEFAULT_CACHE_EXPIRY): void {
  globalCache[key] = {
    data,
    timestamp: Date.now(),
    expiry,
  };
}

/**
 * キャッシュを削除する
 * @param key キャッシュキー
 */
export function removeFromCache(key: string): void {
  delete globalCache[key];
}

/**
 * キャッシュを使用してAPIを呼び出す
 * @param key キャッシュキー
 * @param fetchFn APIを呼び出す関数
 * @param expiry キャッシュの有効期限（ミリ秒）
 * @param forceRefresh キャッシュを無視して強制的に更新するかどうか
 * @returns APIレスポンス
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  expiry = DEFAULT_CACHE_EXPIRY,
  forceRefresh = false
): Promise<T> {
  // 強制更新が指定されていない場合はキャッシュをチェック
  if (!forceRefresh) {
    const cachedData = getFromCache<T>(key);
    if (cachedData !== undefined) {
      return cachedData;
    }
  }
  
  // キャッシュがない場合またはforceRefreshがtrueの場合はAPIを呼び出す
  const data = await fetchFn();
  
  // データをキャッシュに保存
  saveToCache(key, data, expiry);
  
  return data;
}
