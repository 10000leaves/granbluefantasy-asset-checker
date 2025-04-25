import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const itemType = searchParams.get("itemType");

    let sql: string;
    let params: string[] = [];

    if (itemType) {
      sql = `
        SELECT
          tc.*
        FROM tag_categories tc
        WHERE tc.item_type = $1
        ORDER BY tc.order_index
      `;
      params = [itemType];
    } else {
      sql = `
        SELECT
          tc.*
        FROM tag_categories tc
        ORDER BY tc.order_index
      `;
    }

    const { rows } = await query(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, itemType, multipleSelect, required } = body;

    // 最大の order_index を取得
    const {
      rows: [{ max_order }],
    } = await query(
      `
      SELECT COALESCE(MAX(order_index), 0) as max_order
      FROM tag_categories
      WHERE item_type = $1
    `,
      [itemType],
    );

    // タグカテゴリを作成
    const { rows } = await query(
      `
      INSERT INTO tag_categories (
        name,
        item_type,
        multiple_select,
        required,
        order_index
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [name, itemType, multipleSelect, required, max_order + 1],
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error creating tag category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, multipleSelect, required } = body;

    const { rows } = await query(
      `
      UPDATE tag_categories
      SET
        name = $1,
        multiple_select = $2,
        required = $3
      WHERE id = $4
      RETURNING *
    `,
      [name, multipleSelect, required, id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Tag category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating tag category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
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
      // タグ値を削除
      await query(
        `
        DELETE FROM tag_values
        WHERE category_id = $1
      `,
        [id],
      );

      // タグカテゴリを削除
      const { rowCount } = await query(
        `
        DELETE FROM tag_categories
        WHERE id = $1
      `,
        [id],
      );

      if (rowCount === 0) {
        await query("ROLLBACK");
        return NextResponse.json(
          { error: "Tag category not found" },
          { status: 404 },
        );
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
    console.error("Error deleting tag category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
