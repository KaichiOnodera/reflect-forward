"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type EntryResponse } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { EntryDetail } from "@/components/entries/EntryDetail";

export default function EntryDetailPage() {
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

  const handleDelete = async () => {
    if (!window.confirm("この日記を削除しますか？")) return;
    try {
      await api.deleteEntry(id);
      router.push("/entries");
    } catch {
      setError("削除に失敗しました");
    }
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
      <div className="space-y-4">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error || "日記が見つかりません"}
        </div>
        <Link href="/entries" className="text-sm text-blue-600 hover:underline">
          ← 一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/entries" className="text-sm text-blue-600 hover:underline">
        ← 一覧に戻る
      </Link>
      <Card>
        <EntryDetail
          entry={entry}
          onEdit={() => router.push(`/entries/${id}/edit`)}
          onDelete={handleDelete}
        />
      </Card>
    </div>
  );
}
