import { z } from "zod";

/** 日付文字列が実在する日付かどうかを検証 */
const isValidDate = (dateStr: string): boolean => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

/** 日付バリデーション（YYYY-MM-DD形式 + 実在する日付） */
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式で入力してください")
  .refine(isValidDate, "存在しない日付です");

export const createEntrySchema = z
  .object({
    content: z.string().max(10000, "本文は10000文字以内で入力してください").nullable().optional(),
    shortMemo: z.string().max(200, "一言メモは200文字以内で入力してください").nullable().optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    entryDate: dateSchema,
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
    entryDate: dateSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "更新する項目を1つ以上指定してください");

export const listEntriesQuerySchema = z
  .object({
    from: dateSchema.optional(),
    to: dateSchema.optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .refine(
    (data) => !data.from || !data.to || data.from <= data.to,
    "開始日は終了日以前である必要があります"
  );

export const calendarQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const entryIdParamSchema = z.object({
  id: z.string().uuid("無効なIDです"),
});

export type EntryIdParam = z.infer<typeof entryIdParamSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type ListEntriesQuery = z.infer<typeof listEntriesQuerySchema>;
export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
