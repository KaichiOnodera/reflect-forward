"use client";

import { type CalendarEntry } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface CalendarProps {
  year: number;
  month: number;
  entries: CalendarEntry[];
  onDateClick: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

/** 指定月の日数を取得 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 指定月の1日の曜日を取得（0=日曜） */
function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/** 評価に応じた星の色 */
function getRatingColor(avgRating: number | null): string {
  if (avgRating === null) return "text-blue-400";
  if (avgRating >= 4) return "text-yellow-400";
  if (avgRating >= 3) return "text-orange-400";
  return "text-gray-400";
}

export function Calendar({ year, month, entries, onDateClick, onMonthChange }: CalendarProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // 日付 → CalendarEntry のマップ
  const entryMap = new Map<string, CalendarEntry>();
  for (const entry of entries) {
    entryMap.set(entry.date, entry);
  }

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const formatDate = (day: number): string => {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  // カレンダーのセルを生成
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }

  return (
    <div>
      {/* ヘッダー：月ナビ */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="secondary" onClick={handlePrevMonth} className="text-sm">
          ← 前月
        </Button>
        <h2 className="text-lg font-bold text-gray-900">
          {year}年{month}月
        </h2>
        <Button variant="secondary" onClick={handleNextMonth} className="text-sm">
          次月 →
        </Button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-xs font-medium py-1 ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-14" />;
          }

          const dateStr = formatDate(day);
          const entry = entryMap.get(dateStr);
          const dayOfWeek = new Date(year, month - 1, day).getDay();

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onDateClick(dateStr)}
              className={`h-14 rounded-md flex flex-col items-center justify-center text-sm transition-colors hover:bg-gray-100 ${
                dayOfWeek === 0
                  ? "text-red-500"
                  : dayOfWeek === 6
                    ? "text-blue-500"
                    : "text-gray-700"
              }`}
            >
              <span>{day}</span>
              {entry && <span className={`text-xs ${getRatingColor(entry.avgRating)}`}>★</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
