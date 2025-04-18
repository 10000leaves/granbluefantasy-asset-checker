import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 入力項目の作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, required, defaultValue, groupId } = body;

    // 最大の order_index を取得
    const { rows: [{ max_order }] } = await query(`
      SELECT COALESCE(MAX(order_index), 0) as max_order
      FROM input_items
      WHERE group_id = $1
    `, [groupId]);

    // 入力項目を作成
    const { rows } = await query(`
      INSERT INTO input_items (name, type, required, default_value, group_id, order_index)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, type, required, defaultValue, groupId, max_order + 1]);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating input item:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 入力項目の更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, type, required, defaultValue } = body;

    const { rows } = await query(`
      UPDATE input_items
      SET 
        name = $1,
        type = $2,
        required = $3,
        default_value = $4
      WHERE id = $5
      RETURNING *
    `, [name, type, required, defaultValue, id]);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Input item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating input item:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// 入力項目の削除
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

    const { rowCount } = await query(`
      DELETE FROM input_items
      WHERE id = $1
    `, [id]);

    if (rowCount === 0) {
      return NextResponse.json(
        { error: 'Input item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting input item:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
