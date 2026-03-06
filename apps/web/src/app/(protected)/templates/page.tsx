"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type TemplateResponse } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { TemplateCard } from "@/components/templates/TemplateCard";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  // 操作中テンプレートIDを管理し多重送信を防ぐ
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const fetchTemplates = () => {
    setIsLoading(true);
    setError("");
    api
      .getTemplates()
      .then((res) => setTemplates(res.templates))
      .catch(() => setError("テンプレートの取得に失敗しました"))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSetDefault = async (id: string) => {
    if (pendingIds.has(id)) return;
    setActionError("");
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await api.setDefaultTemplate(id);
      fetchTemplates();
    } catch {
      setActionError("デフォルト設定に失敗しました");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このテンプレートを削除しますか？")) return;
    if (pendingIds.has(id)) return;
    setActionError("");
    setPendingIds((prev) => new Set(prev).add(id));
    try {
      await api.deleteTemplate(id);
      fetchTemplates();
    } catch {
      setActionError("削除に失敗しました");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">テンプレート</h2>
        <Link
          href="/templates/new"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          新規作成
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {actionError && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{actionError}</div>
      )}

      {!isLoading && !error && (
        <>
          {templates.length === 0 ? (
            <p className="text-center text-gray-500 py-12">テンプレートがまだありません</p>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isPending={pendingIds.has(template.id)}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
