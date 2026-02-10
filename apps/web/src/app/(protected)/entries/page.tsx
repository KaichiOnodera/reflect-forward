"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, type EntryListResponse } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { EntryCard } from "@/components/entries/EntryCard";
import { Pagination } from "@/components/entries/Pagination";

export default function EntriesPage() {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from") ?? undefined;
  const toParam = searchParams.get("to") ?? undefined;

  const [data, setData] = useState<EntryListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");
    api
      .getEntries({ page, from: fromParam, to: toParam })
      .then(setData)
      .catch(() => setError("日記の取得に失敗しました"))
      .finally(() => setIsLoading(false));
  }, [page, fromParam, toParam]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">日記一覧</h2>
        <Link href="/entries/new">
          <Button>新規作成</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!isLoading && !error && data && (
        <>
          {data.entries.length === 0 ? (
            <p className="text-center text-gray-500 py-12">日記がまだありません</p>
          ) : (
            <div className="space-y-4">
              {data.entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
