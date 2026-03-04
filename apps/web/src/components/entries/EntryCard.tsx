"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { type EntryResponse } from "@/lib/api";
import { formatDateWithDay } from "@/lib/date";
import { RatingStars } from "./RatingStars";

interface EntryCardProps {
  entry: EntryResponse;
}

export function EntryCard({ entry }: EntryCardProps) {
  return (
    <Link href={`/entries/${entry.id}`}>
      <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{formatDateWithDay(entry.entryDate)}</span>
          {entry.rating && <RatingStars value={entry.rating} size="sm" />}
        </div>
        {entry.shortMemo && <p className="text-gray-800 line-clamp-2">{entry.shortMemo}</p>}
        {!entry.shortMemo && entry.content && (
          <p className="text-gray-500 line-clamp-2">{entry.content}</p>
        )}
        {!entry.shortMemo && !entry.content && <p className="text-gray-400 italic">内容なし</p>}
      </Card>
    </Link>
  );
}
