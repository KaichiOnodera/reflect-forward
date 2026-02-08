import { entryRepository } from "../repositories/entryRepository.js";

export class EntryError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND"
  ) {
    super(message);
    this.name = "EntryError";
  }
}

function formatEntryDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatEntry(entry: {
  id: string;
  content: string | null;
  shortMemo: string | null;
  rating: number | null;
  entryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: entry.id,
    content: entry.content,
    shortMemo: entry.shortMemo,
    rating: entry.rating,
    entryDate: formatEntryDate(entry.entryDate),
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export const entryService = {
  async list(
    userId: string,
    query: {
      page: number;
      limit: number;
      from?: string;
      to?: string;
      rating?: number;
    }
  ) {
    const [entries, total] = await Promise.all([
      entryRepository.findByUserId(userId, query),
      entryRepository.countByUserId(userId, query),
    ]);

    return {
      entries: entries.map(formatEntry),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(userId: string, entryId: string) {
    const entry = await entryRepository.findById(entryId);
    if (!entry || entry.userId !== userId) {
      throw new EntryError("日記が見つかりません", "NOT_FOUND");
    }
    return formatEntry(entry);
  },

  async create(
    userId: string,
    input: {
      content?: string | null;
      shortMemo?: string | null;
      rating?: number | null;
      entryDate: string;
    }
  ) {
    const entry = await entryRepository.create({ userId, ...input });
    return formatEntry(entry);
  },

  async update(
    userId: string,
    entryId: string,
    input: {
      content?: string | null;
      shortMemo?: string | null;
      rating?: number | null;
      entryDate?: string;
    }
  ) {
    const existing = await entryRepository.findById(entryId);
    if (!existing || existing.userId !== userId) {
      throw new EntryError("日記が見つかりません", "NOT_FOUND");
    }

    const entry = await entryRepository.update(entryId, input);
    return formatEntry(entry);
  },

  async delete(userId: string, entryId: string) {
    const existing = await entryRepository.findById(entryId);
    if (!existing || existing.userId !== userId) {
      throw new EntryError("日記が見つかりません", "NOT_FOUND");
    }

    await entryRepository.delete(entryId);
  },

  async getCalendar(userId: string, year: number, month: number) {
    const data = await entryRepository.getCalendarData(userId, year, month);

    return {
      entries: data.map((item) => ({
        date: formatEntryDate(item.entryDate),
        count: item._count.id,
        avgRating: item._avg.rating
          ? Math.round(item._avg.rating * 10) / 10
          : null,
      })),
    };
  },
};
