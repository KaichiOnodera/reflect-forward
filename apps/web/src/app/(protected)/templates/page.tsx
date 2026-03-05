"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type TemplateResponse } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { TemplateCard } from "@/components/templates/TemplateCard";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TemplateResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
    await api.setDefaultTemplate(id);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このテンプレートを削除しますか？")) return;
    await api.deleteTemplate(id);
    fetchTemplates();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">テンプレート</h2>
        <Link href="/templates/new">
          <Button>新規作成</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}

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
