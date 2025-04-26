import { NextRequest, NextResponse } from "next/server";

// 認証情報を保存するためのセッションクッキー名
const AUTH_USER_TYPE_COOKIE = "auth_user_type";

export async function GET(request: NextRequest) {
  // レスポンスを作成
  const response = new NextResponse(null, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area", charset="UTF-8"',
      "Content-Type": "text/html; charset=utf-8",
    },
  });

  // クッキーを削除
  response.cookies.delete(AUTH_USER_TYPE_COOKIE);

  return response;
}
