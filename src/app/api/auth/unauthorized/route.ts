import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('Access Denied. Administrator privileges required.', {
    status: 403,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
