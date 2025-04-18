import { Pool } from 'pg';
import { put, del, list } from '@vercel/blob';
import { cache } from 'react';

// データベースプールの設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: true,
  },
});

// データベースクエリのキャッシュ
export const getItems = cache(async (category: string) => {
  const { rows } = await pool.query(`
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
  `, [category]);
  return rows;
});

// タグカテゴリの取得
export const getTagCategories = cache(async (itemType?: string) => {
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
export const getTagValues = cache(async () => {
  const { rows } = await pool.query(`
    SELECT
      tv.*
    FROM tag_values tv
    ORDER BY tv.order_index
  `);
  return rows;
});

// 入力項目の取得
export const getInputItems = cache(async () => {
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

// セッションの作成
export const createSession = async (inputValues: any, selectedItems: string[]) => {
  const { rows } = await pool.query(`
    INSERT INTO user_sessions (input_values, selected_items)
    VALUES ($1, $2)
    RETURNING id
  `, [JSON.stringify(inputValues), JSON.stringify(selectedItems)]);
  return rows[0];
};

// セッションの取得
export const getSession = cache(async (id: string) => {
  const { rows } = await pool.query(`
    SELECT * FROM user_sessions WHERE id = $1
  `, [id]);
  return rows[0];
});

// 画像のアップロード
export const uploadImage = async (file: File) => {
  const blob = await put(file.name, file, {
    access: 'public',
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

// データベースクエリの実行
export const query = async (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// プロセス終了時にプールを閉じる
process.on('SIGTERM', () => {
  pool.end().then(() => {
    console.log('Database pool has ended');
  });
});
