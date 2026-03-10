"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, type EntryResponse } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { EntryForm } from "@/components/entries/EntryForm";

export default function EditEntryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [entry, setEntry] = useState<EntryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");
    api
      .getEntry(id)
      .then((res) => setEntry(res.entry))
      .catch(() => setError("日記が見つかりません"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (data: {
    content?: string | null;
    shortMemo?: string | null;
    rating?: number | null;
    entryDate: string;
  }) => {
    await api.updateEntry(id, data);
    router.push(`/entries/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        {error || "日記が見つかりません"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">日記を編集</h2>
      <Card>
        <EntryForm
          mode="edit"
          initialData={entry}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/entries/${id}`)}
        />
      </Card>
    </div>
  );
}
