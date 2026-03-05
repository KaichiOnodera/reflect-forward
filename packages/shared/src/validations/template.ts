import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "テンプレート名を入力してください")
    .max(50, "テンプレート名は50文字以内で入力してください"),
  content: z
    .string()
    .min(1, "内容を入力してください")
    .max(10000, "内容は10000文字以内で入力してください"),
});

export const updateTemplateSchema = z
  .object({
    name: z.string().min(1).max(50, "テンプレート名は50文字以内で入力してください").optional(),
    content: z.string().min(1).max(10000, "内容は10000文字以内で入力してください").optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.content !== undefined,
    "更新する項目を1つ以上指定してください"
  );

export const templateIdParamSchema = z.object({
  id: z.string().uuid("無効なIDです"),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type TemplateIdParam = z.infer<typeof templateIdParamSchema>;
