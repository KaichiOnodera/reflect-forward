"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type CalendarEntry } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Calendar } from "@/components/entries/Calendar";

export default function CalendarPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError("");
    api
      .getCalendar(year, month)
      .then((res) => {
        if (isActive) setEntries(res.entries);
      })
      .catch(() => {
        if (isActive) setError("カレンダーの取得に失敗しました");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [year, month]);

  // 日記あり → その日の一覧、日記なし → 新規作成（日付プリセット）
  const entryDates = new Set(entries.map((e) => e.date));

  const handleDateClick = (date: string) => {
    if (entryDates.has(date)) {
      router.push(`/entries?from=${date}&to=${date}`);
    } else {
      router.push(`/entries/new?date=${date}`);
    }
  };

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">カレンダー</h2>
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : (
          <Calendar
            year={year}
            month={month}
            entries={entries}
            onDateClick={handleDateClick}
            onMonthChange={handleMonthChange}
          />
        )}
      </Card>
    </div>
  );
}
