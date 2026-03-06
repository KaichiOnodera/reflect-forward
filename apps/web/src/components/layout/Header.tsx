"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogoutButton } from "@/components/auth/LogoutButton";

const NAV_LINKS = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/entries", label: "日記一覧" },
  { href: "/entries/calendar", label: "カレンダー" },
  { href: "/templates", label: "テンプレート" },
];

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* アプリ名 */}
        <Link href="/dashboard" className="text-xl font-bold text-gray-900 hover:text-gray-700">
          Reflect Forward
        </Link>

        {/* デスクトップナビ */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* デスクトップ右側：ユーザー名 + ログアウト */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.displayName || user?.email}</span>
          <LogoutButton />
        </div>

        {/* モバイル：ハンバーガーボタン */}
        <button
          type="button"
          className="md:hidden rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={isMenuOpen ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? (
            /* ✕ アイコン */
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            /* ハンバーガーアイコン */
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* モバイルメニュー */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setIsMenuOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="border-t pt-3 mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">{user?.displayName || user?.email}</span>
            <LogoutButton />
          </div>
        </div>
      )}
    </header>
  );
}
