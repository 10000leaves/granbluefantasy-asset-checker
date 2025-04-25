import { NextRequest, NextResponse } from "next/server";

// 認証情報を保存するためのセッションクッキー名
const AUTH_USER_TYPE_COOKIE = "auth_user_type";

export function middleware(req: NextRequest) {
  // 開発環境では認証をスキップするが、クエリパラメータで認証状態をテストできるようにする
  if (process.env.NODE_ENV === "development") {
    const url = req.nextUrl;
    const userType = url.searchParams.get("userType");

    // クエリパラメータで認証状態をテストする場合
    if (userType === "admin" || userType === "user") {
      const response = NextResponse.next();
      response.cookies.set(AUTH_USER_TYPE_COOKIE, userType, {
        httpOnly: false,
        sameSite: "strict",
        path: "/",
      });

      // クエリパラメータを削除してリダイレクト
      url.searchParams.delete("userType");
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // 認証ヘッダーを取得
  const basicAuth = req.headers.get("authorization");
  const url = req.nextUrl;

  // 認証情報がある場合
  if (basicAuth) {
    try {
      const authValue = basicAuth.split(" ")[1];
      const [user, pwd] = atob(authValue).split(":");

      // 管理者認証
      if (
        user === process.env.BASIC_ADMIN_ID &&
        pwd === process.env.BASIC_ADMIN_PWD
      ) {
        // 管理者として認証成功
        const response = NextResponse.next();
        // 管理者タイプをクッキーに保存
        response.cookies.set(AUTH_USER_TYPE_COOKIE, "admin", {
          httpOnly: false, // JavaScriptからアクセスできるように変更
          sameSite: "strict",
          path: "/",
        });
        return response;
      }

      // 一般ユーザー認証
      if (
        user === process.env.BASIC_USER_ID &&
        pwd === process.env.BASIC_USER_PWD
      ) {
        // 一般ユーザーとして認証成功
        const response = NextResponse.next();
        // 一般ユーザータイプをクッキーに保存
        response.cookies.set(AUTH_USER_TYPE_COOKIE, "user", {
          httpOnly: false, // JavaScriptからアクセスできるように変更
          sameSite: "strict",
          path: "/",
        });

        // 管理画面へのアクセスを制限
        if (url.pathname.startsWith("/admin")) {
          url.pathname = "/api/auth/unauthorized";
          return NextResponse.rewrite(url);
        }

        return response;
      }
    } catch (e) {
      console.error("認証エラー:", e);
    }
  }

  // 認証情報がない場合や認証に失敗した場合
  url.pathname = "/api/auth";
  return NextResponse.rewrite(url);
}

// 管理画面へのアクセスを制限するためのマッチャー
export const config = {
  matcher: [
    /*
     * 以下のパスに対してミドルウェアを適用
     * - api routes (/api/*)
     * - admin routes (/admin/*)
     * - root (/)
     * - その他すべてのルート
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
