"use client";

import { type EntryResponse } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "./RatingStars";

interface EntryDetailProps {
  entry: EntryResponse;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDateWithDay(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日（${weekday}）`;
}

export function EntryDetail({ entry, onEdit, onDelete }: EntryDetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{formatDateWithDay(entry.entryDate)}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onEdit}>
            編集
          </Button>
          <Button variant="danger" onClick={onDelete}>
            削除
          </Button>
        </div>
      </div>

      {entry.rating && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">評価</p>
          <RatingStars value={entry.rating} />
        </div>
      )}

      {entry.shortMemo && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">一言メモ</p>
          <p className="text-gray-800">{entry.shortMemo}</p>
        </div>
      )}

      {entry.content && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">本文</p>
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{entry.content}</div>
        </div>
      )}
    </div>
  );
}
