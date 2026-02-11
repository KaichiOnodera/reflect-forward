"use client";

import { Button } from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // ページ番号のリストを生成（最大5つ表示）
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    let start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="secondary"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="text-sm"
      >
        前へ
      </Button>

      {getPageNumbers().map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`h-9 w-9 rounded-md text-sm font-medium transition-colors ${
            p === page ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          aria-label={`${p}ページ目`}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      <Button
        variant="secondary"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="text-sm"
      >
        次へ
      </Button>
    </div>
  );
}
