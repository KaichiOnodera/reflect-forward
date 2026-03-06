"use client";

import { type FormEvent, useState } from "react";
import { createEntrySchema, updateEntrySchema } from "@reflect-forward/shared";
import { ApiError, type EntryResponse } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RatingStars } from "./RatingStars";

interface EntryFormProps {
  mode: "create" | "edit";
  initialData?: EntryResponse;
  defaultContent?: string;
  onSubmit: (data: {
    content?: string | null;
    shortMemo?: string | null;
    rating?: number | null;
    entryDate: string;
  }) => Promise<void>;
  onCancel: () => void;
}

const SHORT_MEMO_MAX = 200;

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function EntryForm({
  mode,
  initialData,
  defaultContent,
  onSubmit,
  onCancel,
}: EntryFormProps) {
  const [entryDate, setEntryDate] = useState(initialData?.entryDate ?? getTodayString());
  const [rating, setRating] = useState<number | null>(initialData?.rating ?? null);
  const [shortMemo, setShortMemo] = useState(initialData?.shortMemo ?? "");
  const [content, setContent] = useState(initialData?.content ?? defaultContent ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const data = {
      entryDate,
      rating: rating ?? null,
      shortMemo: shortMemo || null,
      content: content || null,
    };

    const schema = mode === "create" ? createEntrySchema : updateEntrySchema;
    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key && !fieldErrors[String(key)]) {
          fieldErrors[String(key)] = issue.message;
        }
        // refinement エラー（path が空）
        if (issue.path.length === 0 && !fieldErrors._form) {
          fieldErrors._form = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (e) {
      if (e instanceof ApiError) {
        setApiError(e.message);
      } else {
        setApiError("エラーが発生しました。もう一度お試しください");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {apiError && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{apiError}</div>}
      {errors._form && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{errors._form}</div>
      )}

      <Input
        label="日付"
        type="date"
        value={entryDate}
        onChange={(e) => setEntryDate(e.target.value)}
        error={errors.entryDate}
        disabled={isSubmitting}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">評価</label>
        <RatingStars value={rating} onChange={isSubmitting ? undefined : setRating} />
        {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="shortMemo" className="block text-sm font-medium text-gray-700">
            一言メモ
          </label>
          <span
            className={`text-xs ${shortMemo.length > SHORT_MEMO_MAX ? "text-red-600" : "text-gray-500"}`}
          >
            {shortMemo.length}/{SHORT_MEMO_MAX}
          </span>
        </div>
        <input
          id="shortMemo"
          type="text"
          value={shortMemo}
          onChange={(e) => setShortMemo(e.target.value)}
          disabled={isSubmitting}
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
            errors.shortMemo ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="今日を一言で表すと..."
        />
        {errors.shortMemo && <p className="mt-1 text-sm text-red-600">{errors.shortMemo}</p>}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          本文
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          rows={5}
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
            errors.content ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="今日はどんな一日でしたか？"
        />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
      </div>

      <div className="flex gap-3">
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          {mode === "create" ? "保存する" : "更新する"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
