"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { type TemplateResponse } from "@/lib/api";

interface TemplateCardProps {
  template: TemplateResponse;
  onSetDefault: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TemplateCard({ template, onSetDefault, onDelete }: TemplateCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 truncate">{template.name}</h3>
            {template.isDefault && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                デフォルト
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 whitespace-pre-wrap">
            {template.content}
          </p>
        </div>
        <div className="shrink-0 flex flex-col gap-2">
          <Link href={`/templates/${template.id}/edit`}>
            <Button variant="secondary" className="w-full text-sm">
              編集
            </Button>
          </Link>
          {!template.isDefault && (
            <Button
              variant="secondary"
              className="text-sm"
              onClick={() => onSetDefault(template.id)}
            >
              デフォルトに設定
            </Button>
          )}
          <Button
            variant="secondary"
            className="text-sm text-red-600 hover:text-red-700"
            onClick={() => onDelete(template.id)}
          >
            削除
          </Button>
        </div>
      </div>
    </Card>
  );
}
