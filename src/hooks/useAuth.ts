"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie, deleteCookie } from "cookies-next";

// 認証情報を保存するためのセッションクッキー名
const AUTH_USER_TYPE_COOKIE = "auth_user_type";

export type UserType = "admin" | "user" | null;

export function useAuth() {
  const [userType, setUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // クッキーから認証情報を取得
    const authUserType = getCookie(AUTH_USER_TYPE_COOKIE) as UserType;
    setUserType(authUserType || null);
    setIsLoading(false);
  }, []);

  // 管理者かどうかを判定
  const isAdmin = userType === "admin";

  // 一般ユーザーかどうかを判定
  const isUser = userType === "user";

  // 認証されているかどうかを判定
  const isAuthenticated = userType !== null;

  // 管理画面へのアクセスを制限
  const requireAdmin = () => {
    if (!isLoading && !isAdmin) {
      router.push("/");
      return false;
    }
    return true;
  };

  // ログアウト処理
  const logout = async () => {
    try {
      // ログアウトAPIを呼び出し
      const response = await fetch("/api/auth/logout");
      
      // クッキーから認証情報を削除
      deleteCookie(AUTH_USER_TYPE_COOKIE);
      
      // 状態を更新
      setUserType(null);
      
      // ホームページにリダイレクト
      window.location.href = "/";
    } catch (error) {
      console.error("ログアウトエラー:", error);
      
      // エラーが発生した場合でもクッキーを削除して状態を更新
      deleteCookie(AUTH_USER_TYPE_COOKIE);
      setUserType(null);
      
      // ホームページにリダイレクト
      window.location.href = "/";
    }
  };

  return {
    userType,
    isAdmin,
    isUser,
    isAuthenticated,
    isLoading,
    requireAdmin,
    logout,
  };
}
