import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { validateRequestBody, validateQueryParams, sanitizeObject } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // クエリパラメータのバリデーション
    const validation = validateQueryParams(searchParams, ['category']);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
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
        ORDER BY i.implementation_date DESC NULLS LAST, i.name
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
        ORDER BY i.implementation_date DESC NULLS LAST, i.category, i.name
      `;
    }

    const { rows } = await query(sql, params);
    
    // image_urlをimageUrlに変換
    const formattedRows = rows.map(row => {
      const { image_url, ...rest } = row;
      return {
        ...rest,
        imageUrl: image_url
      };
    });
    
    return NextResponse.json(formattedRows);
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
    
    // リクエストボディのバリデーション
    const validation = validateRequestBody(body, ['name', 'category']);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // 入力値のサニタイズ
    const sanitizedBody = sanitizeObject(body);
    const { name, category, imageUrl, implementationDate, tags } = sanitizedBody;

    // トランザクションを開始
    await query('BEGIN');

    try {
      // アイテムを作成
      const { rows: [item] } = await query(`
        INSERT INTO items (name, category, image_url, implementation_date)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [name, category, imageUrl, implementationDate]);

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

      // タグ情報を含めた応答を返す
      const { rows: [itemWithTags] } = await query(`
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
        WHERE i.id = $1
        GROUP BY i.id
      `, [item.id]);
      
      // image_urlをimageUrlに変換
      const { image_url, ...rest } = itemWithTags;
      const formattedItem = {
        ...rest,
        imageUrl: image_url
      };
      
      return NextResponse.json(formattedItem);
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
    
    // リクエストボディのバリデーション
    const validation = validateRequestBody(body, ['id', 'name', 'category']);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    // 入力値のサニタイズ
    const sanitizedBody = sanitizeObject(body);
    const { id, name, category, imageUrl, implementationDate, tags } = sanitizedBody;

    // トランザクションを開始
    await query('BEGIN');

    try {
      // アイテムを更新
      const { rows: [item] } = await query(`
        UPDATE items
        SET name = $1, category = $2, image_url = $3, implementation_date = $4
        WHERE id = $5
        RETURNING *
      `, [name, category, imageUrl, implementationDate, id]);

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
        console.log('Creating tag associations for item:', id);
        console.log('Tags:', tags);
        
        for (const tag of tags) {
          console.log('Processing tag:', tag);
          console.log('Tag valueId:', tag.valueId);
          
          // valueIdが存在するか確認
          if (!tag.valueId) {
            console.error('Missing valueId in tag:', tag);
            continue;
          }
          
          try {
            await query(`
              INSERT INTO item_tags (item_id, tag_value_id)
              VALUES ($1, $2)
            `, [id, tag.valueId]);
            console.log('Tag association created successfully');
          } catch (err) {
            console.error('Error creating tag association:', err);
            throw err;
          }
        }
      } else {
        console.log('No tags to create for item:', id);
      }

      // トランザクションをコミット
      await query('COMMIT');

      // タグ情報を含めた応答を返す
      console.log('Fetching item with tags for id:', id);
      
      // まず、アイテムタグの関連付けを確認
      const { rows: itemTags } = await query(`
        SELECT it.*, tv.category_id, tv.value
        FROM item_tags it
        JOIN tag_values tv ON it.tag_value_id = tv.id
        WHERE it.item_id = $1
      `, [id]);
      
      console.log('Item tags found:', itemTags);
      
      // アイテムとタグ情報を取得
      const { rows: [itemWithTags] } = await query(`
        SELECT
          i.*,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'categoryId', tc.id,
                  'valueId', tv.id,
                  'categoryName', tc.name,
                  'value', tv.value
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
        WHERE i.id = $1
        GROUP BY i.id
      `, [id]);
      
      console.log('Item with tags:', itemWithTags);
      
      // image_urlをimageUrlに変換
      const { image_url, ...rest } = itemWithTags;
      const formattedItem = {
        ...rest,
        imageUrl: image_url
      };
      
      return NextResponse.json(formattedItem);
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
    
    // クエリパラメータのバリデーション
    const validation = validateQueryParams(searchParams, ['id']);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
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
