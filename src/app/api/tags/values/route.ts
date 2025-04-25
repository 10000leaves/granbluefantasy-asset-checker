import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");

    let sql: string;
    let params: string[] = [];

    if (categoryId) {
      sql = `
        SELECT *
        FROM tag_values
        WHERE category_id = $1
        ORDER BY order_index
      `;
      params = [categoryId];
    } else {
      sql = `
        SELECT *
        FROM tag_values
        ORDER BY category_id, order_index
      `;
    }

    const { rows } = await query(sql, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching tag values:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { value, categoryId } = body;

    // 最大の order_index を取得
    const {
      rows: [{ max_order }],
    } = await query(
      `
      SELECT COALESCE(MAX(order_index), 0) as max_order
      FROM tag_values
      WHERE category_id = $1
    `,
      [categoryId],
    );

    // タグ値を作成
    const { rows } = await query(
      `
      INSERT INTO tag_values (value, category_id, order_index)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
      [value, categoryId, max_order + 1],
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error creating tag value:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, value } = body;

    const { rows } = await query(
      `
      UPDATE tag_values
      SET value = $1
      WHERE id = $2
      RETURNING *
    `,
      [value, id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Tag value not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error updating tag value:", error);
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

    const { rowCount } = await query(
      `
      DELETE FROM tag_values
      WHERE id = $1
    `,
      [id],
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { error: "Tag value not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tag value:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
