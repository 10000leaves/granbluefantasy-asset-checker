import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('アクセス権限がありません。管理者権限が必要です。', {
    status: 403,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
