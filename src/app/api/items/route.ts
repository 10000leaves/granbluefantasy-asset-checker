import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    let sql: string;
    let params: string[] = [];

    if (category) {
      sql = `
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
      `;
      params = [category];
    } else {
      sql = `
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
        GROUP BY i.id
        ORDER BY i.category, i.name
      `;
    }

    const { rows } = await query(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, imageUrl, tags } = body;

    // トランザクションを開始
    await query('BEGIN');

    try {
      // アイテムを作成
      const { rows: [item] } = await query(`
        INSERT INTO items (name, category, image_url)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [name, category, imageUrl]);

      // タグが指定されている場合は関連付けを作成
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await query(`
            INSERT INTO item_tags (item_id, tag_value_id)
            VALUES ($1, $2)
          `, [item.id, tag.valueId]);
        }
      }

      // トランザクションをコミット
      await query('COMMIT');

      return NextResponse.json(item);
    } catch (err) {
      // エラーが発生した場合はロールバック
      await query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, category, imageUrl, tags } = body;

    // トランザクションを開始
    await query('BEGIN');

    try {
      // アイテムを更新
      const { rows: [item] } = await query(`
        UPDATE items
        SET name = $1, category = $2, image_url = $3
        WHERE id = $4
        RETURNING *
      `, [name, category, imageUrl, id]);

      if (!item) {
        await query('ROLLBACK');
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }

      // 既存のタグ関連付けを削除
      await query(`
        DELETE FROM item_tags
        WHERE item_id = $1
      `, [id]);

      // 新しいタグ関連付けを作成
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await query(`
            INSERT INTO item_tags (item_id, tag_value_id)
            VALUES ($1, $2)
          `, [id, tag.valueId]);
        }
      }

      // トランザクションをコミット
      await query('COMMIT');

      return NextResponse.json(item);
    } catch (err) {
      // エラーが発生した場合はロールバック
      await query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 }
      );
    }

    // トランザクションを開始
    await query('BEGIN');

    try {
      // タグ関連付けを削除
      await query(`
        DELETE FROM item_tags
        WHERE item_id = $1
      `, [id]);

      // アイテムを削除
      const { rowCount } = await query(`
        DELETE FROM items
        WHERE id = $1
      `, [id]);

      if (rowCount === 0) {
        await query('ROLLBACK');
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }

      // トランザクションをコミット
      await query('COMMIT');

      return NextResponse.json({ success: true });
    } catch (err) {
      // エラーが発生した場合はロールバック
      await query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
