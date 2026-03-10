"use client";

export const runtime = "edge";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { TemplateForm } from "@/components/templates/TemplateForm";

export default function NewTemplatePage() {
  const router = useRouter();

  const handleSubmit = async (data: { name: string; content: string }) => {
    await api.createTemplate(data);
    router.push("/templates");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">テンプレートを作成</h2>
      <Card>
        <TemplateForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/templates")}
        />
      </Card>
    </div>
  );
}
