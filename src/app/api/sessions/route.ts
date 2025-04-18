import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputValues, selectedItems } = body;

    if (!inputValues || !selectedItems) {
      return NextResponse.json(
        { error: 'InputValues and selectedItems are required' },
        { status: 400 }
      );
    }

    const { rows } = await query(`
      INSERT INTO user_sessions (input_values, selected_items)
      VALUES ($1, $2)
      RETURNING id
    `, [JSON.stringify(inputValues), JSON.stringify(selectedItems)]);

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const { rows } = await query(`
      SELECT * FROM user_sessions WHERE id = $1
    `, [id]);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching session:', error);
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
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const { rowCount } = await query(`
      DELETE FROM user_sessions WHERE id = $1
    `, [id]);

    if (rowCount === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
