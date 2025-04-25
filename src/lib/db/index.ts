import { Pool } from "pg";
import { put, del, list } from "@vercel/blob";

// 環境に応じてcache関数を使用するかどうかを切り替える
// Node.js環境（マイグレーションスクリプトなど）では関数をそのまま返す
const cacheFunction = <T extends (...args: any[]) => any>(fn: T): T => {
  // Next.js環境ではReactのcache関数を使用
  if (typeof process !== "undefined" && process.env.NEXT_RUNTIME === "nodejs") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { cache } = require("react");
      return cache(fn);
    } catch (e) {
      // Reactのcache関数が使用できない場合は関数をそのまま返す
      return fn;
    }
  }
  // Node.js環境では関数をそのまま返す
  return fn;
};

// データベースプールの設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false, // 本番環境では自己署名証明書を許可
        }
      : false, // 開発環境ではSSLを無効化
});

// 接続テスト
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// 接続テスト用の関数
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("Database connection successful");
    client.release();
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
};

// データベースクエリのキャッシュ
export const getItems = cacheFunction(async (category: string) => {
  const { rows } = await pool.query(
    `
    SELECT
      i.*,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'categoryId', tc.id,
              'valueId', tv.id
            )
          )
          FROM item_tags it
          JOIN tag_values tv ON it.tag_value_id = tv.id
          JOIN tag_categories tc ON tv.category_id = tc.id
          WHERE it.item_id = i.id
        ),
        '[]'::json
      ) as tags
    FROM items i
    WHERE i.category = $1
    GROUP BY i.id
    ORDER BY i.name
  `,
    [category],
  );
  return rows;
});

// タグカテゴリの取得
export const getTagCategories = cacheFunction(async (itemType?: string) => {
  let query = `
    SELECT
      tc.*
    FROM tag_categories tc
  `;

  const params = [];

  if (itemType) {
    query += ` WHERE tc.item_type = $1`;
    params.push(itemType);
  }

  query += ` ORDER BY tc.order_index`;

  const { rows } = await pool.query(query, params);
  return rows;
});

// タグ値の取得
export const getTagValues = cacheFunction(async () => {
  const { rows } = await pool.query(`
    SELECT
      tv.*
    FROM tag_values tv
    ORDER BY tv.order_index
  `);
  return rows;
});

// 入力項目の取得
export const getInputItems = cacheFunction(async () => {
  const { rows } = await pool.query(`
    SELECT
      ig.id as group_id,
      ig.name as group_name,
      ig.order_index as group_order,
      json_agg(
        json_build_object(
          'id', ii.id,
          'name', ii.name,
          'type', ii.type,
          'required', ii.required,
          'default_value', ii.default_value,
          'order_index', ii.order_index
        ) ORDER BY ii.order_index
      ) as items
    FROM input_groups ig
    LEFT JOIN input_items ii ON ig.id = ii.group_id
    GROUP BY ig.id, ig.name, ig.order_index
    ORDER BY ig.order_index
  `);
  return rows;
});

// 画像のアップロード
export const uploadImage = async (file: File) => {
  const blob = await put(file.name, file, {
    access: "public",
  });
  return blob.url;
};

// 画像の削除
export const deleteImage = async (url: string) => {
  await del(url);
};

// 画像一覧の取得
export const listImages = async () => {
  const images = await list();
  return images;
};

// データベースクエリの実行（SQLインジェクション対策強化版）
export const query = async (text: string, params?: any[]) => {
  try {
    // SQLインジェクションの可能性がある危険なパターンをチェック
    const dangerousPatterns = [
      /;\s*DROP\s+/i,
      /;\s*DELETE\s+/i,
      /;\s*UPDATE\s+/i,
      /;\s*INSERT\s+/i,
      /;\s*ALTER\s+/i,
      /;\s*CREATE\s+/i,
      /UNION\s+SELECT/i,
      /OR\s+1\s*=\s*1/i,
      /OR\s+'[^']*'\s*=\s*'[^']*'/i,
      /--/,
      /\/\*/,
      /\*\//,
    ];

    // SQLクエリに危険なパターンが含まれていないか確認
    if (dangerousPatterns.some((pattern) => pattern.test(text))) {
      console.error("Potentially malicious SQL query detected:", text);
      throw new Error("Invalid SQL query");
    }

    // パラメータのバリデーション
    if (params) {
      params = params.map((param) => {
        // nullまたはundefinedの場合はそのまま返す
        if (param === null || param === undefined) {
          return param;
        }

        // 文字列の場合は特殊文字をエスケープ
        if (typeof param === "string") {
          // SQLインジェクションの可能性がある文字列をチェック
          if (dangerousPatterns.some((pattern) => pattern.test(param))) {
            console.error("Potentially malicious parameter detected:", param);
            throw new Error("Invalid parameter");
          }
          return param;
        }

        return param;
      });
    }

    // クエリを実行
    return pool.query(text, params);
  } catch (error) {
    // エラーログを記録
    console.error("Database query error:", error);

    // エラーを再スロー（詳細情報は含めない）
    throw new Error("Database query failed");
  }
};

// プロセス終了時にプールを閉じる
process.on("SIGTERM", () => {
  pool.end().then(() => {
    console.log("Database pool has ended");
  });
});
