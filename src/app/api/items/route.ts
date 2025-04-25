import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  validateRequestBody,
  validateQueryParams,
  sanitizeObject,
} from "@/lib/utils/validation";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // クエリパラメータのバリデーション
    const validation = validateQueryParams(searchParams, ["category"]);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const category = searchParams.get("category");

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

    // image_urlをimageUrl、implementation_dateをimplementationDateに変換
    const formattedRows = rows.map((row) => {
      const { image_url, implementation_date, ...rest } = row;
      return {
        ...rest,
        imageUrl: image_url,
        implementationDate: implementation_date,
      };
    });

    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // リクエストボディのバリデーション
    const validation = validateRequestBody(body, ["name", "category"]);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 入力値のサニタイズ
    const sanitizedBody = sanitizeObject(body);
    const { name, category, imageUrl, implementationDate, tags } =
      sanitizedBody;

    // トランザクションを開始
    await query("BEGIN");

    try {
      // アイテムを作成
      const {
        rows: [item],
      } = await query(
        `
        INSERT INTO items (name, category, image_url, implementation_date)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
        [name, category, imageUrl, implementationDate],
      );

      // タグが指定されている場合は関連付けを作成
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await query(
            `
            INSERT INTO item_tags (item_id, tag_value_id)
            VALUES ($1, $2)
          `,
            [item.id, tag.valueId],
          );
        }
      }

      // トランザクションをコミット
      await query("COMMIT");

      // タグ情報を含めた応答を返す
      const {
        rows: [itemWithTags],
      } = await query(
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
        WHERE i.id = $1
        GROUP BY i.id
      `,
        [item.id],
      );

      // image_urlをimageUrl、implementation_dateをimplementationDateに変換
      const { image_url, implementation_date, ...rest } = itemWithTags;
      const formattedItem = {
        ...rest,
        imageUrl: image_url,
        implementationDate: implementation_date,
      };

      return NextResponse.json(formattedItem);
    } catch (err) {
      // エラーが発生した場合はロールバック
      await query("ROLLBACK");
      throw err;
    }
  } catch (error) {
    console.error("Error creating item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // リクエストボディのバリデーション
    const validation = validateRequestBody(body, ["id", "name", "category"]);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 入力値のサニタイズ
    const sanitizedBody = sanitizeObject(body);
    const { id, name, category, imageUrl, implementationDate, tags } =
      sanitizedBody;

    // トランザクションを開始
    await query("BEGIN");

    try {
      // アイテムを更新
      const {
        rows: [item],
      } = await query(
        `
        UPDATE items
        SET name = $1, category = $2, image_url = $3, implementation_date = $4
        WHERE id = $5
        RETURNING *
      `,
        [name, category, imageUrl, implementationDate, id],
      );

      if (!item) {
        await query("ROLLBACK");
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      // 既存のタグ関連付けを削除
      await query(
        `
        DELETE FROM item_tags
        WHERE item_id = $1
      `,
        [id],
      );

      // 新しいタグ関連付けを作成
      if (tags && tags.length > 0) {
        // タグ値が存在するか確認
        const { rows: allTagValues } = await query(`
          SELECT id, category_id, value
          FROM tag_values
        `);

        for (const tag of tags) {
          // valueIdが存在するか確認
          if (!tag.valueId) {
            continue;
          }

          // タグ値が存在するか確認
          const tagValue = allTagValues.find((v: any) => v.id === tag.valueId);
          if (!tagValue) {
            continue;
          }

          try {
            // タグ関連付けを作成
            await query(
              `
              INSERT INTO item_tags (item_id, tag_value_id)
              VALUES ($1, $2)
              ON CONFLICT (item_id, tag_value_id) DO NOTHING
              RETURNING id
            `,
              [id, tag.valueId],
            );
          } catch (err) {
            throw err;
          }
        }
      }

      // トランザクションをコミット
      await query("COMMIT");

      // アイテムとタグ情報を取得
      const {
        rows: [itemWithTags],
      } = await query(
        `
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
      `,
        [id],
      );

      // image_urlをimageUrl、implementation_dateをimplementationDateに変換
      const { image_url, implementation_date, ...rest } = itemWithTags;
      const formattedItem = {
        ...rest,
        imageUrl: image_url,
        implementationDate: implementation_date,
      };

      return NextResponse.json(formattedItem);
    } catch (err) {
      // エラーが発生した場合はロールバック
      await query("ROLLBACK");
      throw err;
    }
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // クエリパラメータのバリデーション
    const validation = validateQueryParams(searchParams, ["id"]);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID parameter is required" },
        { status: 400 },
      );
    }

    // トランザクションを開始
    await query("BEGIN");

    try {
      // タグ関連付けを削除
      await query(
        `
        DELETE FROM item_tags
        WHERE item_id = $1
      `,
        [id],
      );

      // アイテムを削除
      const { rowCount } = await query(
        `
        DELETE FROM items
        WHERE id = $1
      `,
        [id],
      );

      if (rowCount === 0) {
        await query("ROLLBACK");
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      // トランザクションをコミット
      await query("COMMIT");

      return NextResponse.json({ success: true });
    } catch (err) {
      // エラーが発生した場合はロールバック
      await query("ROLLBACK");
      throw err;
    }
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
