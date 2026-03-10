"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ApiError, api, type TemplateResponse } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { TemplateForm } from "@/components/templates/TemplateForm";

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [template, setTemplate] = useState<TemplateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("無効なテンプレートIDです");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError("");
    api
      .getTemplate(id)
      .then((res) => setTemplate(res.template))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) {
          setError("テンプレートが見つかりません");
        } else {
          setError(e instanceof ApiError ? e.message : "テンプレートの取得に失敗しました");
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleSubmit = async (data: { name: string; content: string }) => {
    if (!id) return;
    await api.updateTemplate(id, data);
    router.push("/templates");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
        {error || "テンプレートが見つかりません"}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">テンプレートを編集</h2>
      <Card>
        <TemplateForm
          mode="edit"
          initialData={{ name: template.name, content: template.content }}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/templates")}
        />
      </Card>
    </div>
  );
}
