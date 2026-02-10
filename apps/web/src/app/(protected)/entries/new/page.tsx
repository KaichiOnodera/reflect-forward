"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { EntryForm } from "@/components/entries/EntryForm";

export default function NewEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");

  // date クエリパラメータで日付をプリセット
  const initialData = dateParam
    ? {
        id: "",
        content: null,
        shortMemo: null,
        rating: null,
        entryDate: dateParam,
        createdAt: "",
        updatedAt: "",
      }
    : undefined;

  const handleSubmit = async (data: {
    content?: string | null;
    shortMemo?: string | null;
    rating?: number | null;
    entryDate: string;
  }) => {
    await api.createEntry(data);
    router.push("/entries");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">日記を書く</h2>
      <Card>
        <EntryForm
          mode="create"
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/entries")}
        />
      </Card>
    </div>
  );
}
