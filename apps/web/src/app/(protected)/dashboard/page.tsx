"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { api, type EntryResponse } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { EntryCard } from "@/components/entries/EntryCard";

export default function DashboardPage() {
  const { user } = useAuth();
  const displayName = user?.displayName ?? user?.email ?? "ユーザー";

  const [recentEntries, setRecentEntries] = useState<EntryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getEntries({ limit: 3 })
      .then((res) => setRecentEntries(res.entries))
      .catch(() => setError("日記の取得に失敗しました"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">ようこそ、{displayName} さん</h2>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/entries/new">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <p className="text-lg font-semibold text-gray-900">日記を書く</p>
            <p className="text-sm text-gray-500 mt-1">今日の振り返りを記録しましょう</p>
          </Card>
        </Link>
        <Link href="/entries/calendar">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <p className="text-lg font-semibold text-gray-900">カレンダーを見る</p>
            <p className="text-sm text-gray-500 mt-1">これまでの記録を振り返りましょう</p>
          </Card>
        </Link>
      </div>

      {/* 最近の日記 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">最近の日記</h3>
          <Link href="/entries" className="text-sm text-blue-600 hover:underline">
            すべて見る
          </Link>
        </div>

        {isLoading ? (
          <p className="text-gray-500 text-sm">読み込み中...</p>
        ) : error ? (
          <Card className="p-6">
            <p className="text-gray-500">{error}</p>
          </Card>
        ) : recentEntries.length === 0 ? (
          <Card className="p-6">
            <p className="text-gray-500">まだ日記がありません。最初の一歩を踏み出しましょう！</p>
          </Card>
        ) : (
          recentEntries.map((entry) => <EntryCard key={entry.id} entry={entry} />)
        )}
      </div>
    </div>
  );
}
