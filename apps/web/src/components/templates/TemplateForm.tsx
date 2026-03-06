"use client";

import { type FormEvent, useState } from "react";
import { createTemplateSchema, updateTemplateSchema } from "@reflect-forward/shared";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface TemplateFormProps {
  mode: "create" | "edit";
  initialData?: { name: string; content: string };
  onSubmit: (data: { name: string; content: string }) => Promise<void>;
  onCancel: () => void;
}

const CONTENT_MAX = 10000;

export function TemplateForm({ mode, initialData, onSubmit, onCancel }: TemplateFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const data = { name, content };
    const schema = mode === "create" ? createTemplateSchema : updateTemplateSchema;
    const result = schema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key && !fieldErrors[String(key)]) {
          fieldErrors[String(key)] = issue.message;
        }
        // refinement エラー（path が空）はフォームレベルのエラーとして表示
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
        label="テンプレート名"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        disabled={isSubmitting}
        placeholder="例：日次振り返り"
      />

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            内容
          </label>
          <span
            className={`text-xs ${content.length > CONTENT_MAX ? "text-red-600" : "text-gray-500"}`}
          >
            {content.length}/{CONTENT_MAX}
          </span>
        </div>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          rows={8}
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
            errors.content ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="テンプレートの内容を入力してください"
        />
        {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
      </div>

      <div className="flex gap-3">
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          {mode === "create" ? "作成する" : "更新する"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          キャンセル
        </Button>
      </div>
    </form>
  );
}
