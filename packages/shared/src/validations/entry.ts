import { z } from "zod";

export const createEntrySchema = z
  .object({
    content: z.string().max(10000, "本文は10000文字以内で入力してください").nullable().optional(),
    shortMemo: z.string().max(200, "一言メモは200文字以内で入力してください").nullable().optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式で入力してください"),
  })
  .refine(
    (data) => data.content || data.shortMemo || data.rating,
    "本文、一言メモ、評価のいずれかを入力してください"
  );

export const updateEntrySchema = z
  .object({
    content: z.string().max(10000, "本文は10000文字以内で入力してください").nullable().optional(),
    shortMemo: z.string().max(200, "一言メモは200文字以内で入力してください").nullable().optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式で入力してください").optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "更新する項目を1つ以上指定してください"
  );

export const listEntriesQuerySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    (data) => !data.from || !data.to || data.from <= data.to,
    "開始日は終了日以前である必要があります"
  );

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type ListEntriesQuery = z.infer<typeof listEntriesQuerySchema>;
