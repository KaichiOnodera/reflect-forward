import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const templateRepository = {
  async findByUserId(userId: string) {
    return prisma.diaryTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.diaryTemplate.findUnique({
      where: { id },
    });
  },

  async findDefault(userId: string) {
    return prisma.diaryTemplate.findFirst({
      where: { userId, isDefault: true },
    });
  },

  async create(data: { userId: string; name: string; content: string }) {
    return prisma.diaryTemplate.create({
      data,
    });
  },

  async update(id: string, data: { name?: string; content?: string }) {
    const updateData: Prisma.DiaryTemplateUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.content !== undefined) updateData.content = data.content;

    return prisma.diaryTemplate.update({
      where: { id },
      data: updateData,
    });
  },

  async delete(id: string) {
    return prisma.diaryTemplate.delete({
      where: { id },
    });
  },

  /** 指定テンプレートをデフォルトに設定し、他のデフォルトを解除する */
  async setDefault(userId: string, templateId: string) {
    return prisma.$transaction([
      prisma.diaryTemplate.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      }),
      prisma.diaryTemplate.update({
        where: { id: templateId },
        data: { isDefault: true },
      }),
    ]);
  },
};
