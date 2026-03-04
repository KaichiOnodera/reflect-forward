import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

interface FindOptions {
  page: number;
  limit: number;
  from?: string;
  to?: string;
  rating?: number;
}

function buildWhereClause(
  userId: string,
  options: { from?: string; to?: string; rating?: number }
) {
  const where: Prisma.DiaryEntryWhereInput = { userId };

  if (options.from || options.to) {
    const entryDate: Prisma.DateTimeFilter = {};
    if (options.from) entryDate.gte = new Date(options.from);
    if (options.to) entryDate.lte = new Date(options.to);
    where.entryDate = entryDate;
  }

  if (options.rating !== undefined) {
    where.rating = options.rating;
  }

  return where;
}

export const entryRepository = {
  async findByUserId(userId: string, options: FindOptions) {
    const where = buildWhereClause(userId, options);

    return prisma.diaryEntry.findMany({
      where,
      orderBy: { entryDate: "desc" },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });
  },

  async countByUserId(userId: string, options: { from?: string; to?: string; rating?: number }) {
    const where = buildWhereClause(userId, options);
    return prisma.diaryEntry.count({ where });
  },

  async findById(id: string) {
    return prisma.diaryEntry.findUnique({
      where: { id },
    });
  },

  async create(data: {
    userId: string;
    content?: string | null;
    shortMemo?: string | null;
    rating?: number | null;
    entryDate: string;
  }) {
    return prisma.diaryEntry.create({
      data: {
        userId: data.userId,
        content: data.content ?? null,
        shortMemo: data.shortMemo ?? null,
        rating: data.rating ?? null,
        entryDate: new Date(data.entryDate),
      },
    });
  },

  async update(
    id: string,
    data: {
      content?: string | null;
      shortMemo?: string | null;
      rating?: number | null;
      entryDate?: string;
    }
  ) {
    const updateData: Prisma.DiaryEntryUpdateInput = {};
    if (data.content !== undefined) updateData.content = data.content;
    if (data.shortMemo !== undefined) updateData.shortMemo = data.shortMemo;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.entryDate !== undefined) updateData.entryDate = new Date(data.entryDate);

    return prisma.diaryEntry.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string) {
    return prisma.diaryEntry.delete({
      where: { id },
    });
  },

  async getCalendarData(userId: string, year: number, month: number) {
    return prisma.diaryEntry.groupBy({
      by: ["entryDate"],
      where: {
        userId,
        entryDate: {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lt: new Date(Date.UTC(year, month, 1)),
        },
      },
      _count: { id: true },
      _avg: { rating: true },
    });
  },
};
