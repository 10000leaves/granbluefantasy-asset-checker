import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// 入力項目グループの取得
export async function GET(request: NextRequest) {
  try {
    const { rows } = await query(`
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

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching input items:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// 入力項目グループの作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    // 最大の order_index を取得
    const {
      rows: [{ max_order }],
    } = await query(`
      SELECT COALESCE(MAX(order_index), 0) as max_order
      FROM input_groups
    `);

    // グループを作成
    const { rows } = await query(
      `
      INSERT INTO input_groups (name, order_index)
      VALUES ($1, $2)
      RETURNING *
    `,
      [name, max_order + 1],
    );

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error creating input group:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
