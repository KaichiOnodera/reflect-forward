import type { CreateTemplateInput, UpdateTemplateInput } from "@reflect-forward/shared";
import { templateRepository } from "../repositories/templateRepository.js";

export class TemplateError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND"
  ) {
    super(message);
    this.name = "TemplateError";
  }
}

function formatTemplate(template: {
  id: string;
  userId: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: template.id,
    userId: template.userId,
    name: template.name,
    content: template.content,
    isDefault: template.isDefault,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export const templateService = {
  async list(userId: string) {
    const templates = await templateRepository.findByUserId(userId);
    return { templates: templates.map(formatTemplate) };
  },

  async getById(userId: string, templateId: string) {
    const template = await templateRepository.findById(templateId);
    if (!template || template.userId !== userId) {
      throw new TemplateError("テンプレートが見つかりません", "NOT_FOUND");
    }
    return formatTemplate(template);
  },

  async getDefault(userId: string) {
    const template = await templateRepository.findDefault(userId);
    if (!template) {
      throw new TemplateError("デフォルトテンプレートが設定されていません", "NOT_FOUND");
    }
    return formatTemplate(template);
  },

  async create(userId: string, input: CreateTemplateInput) {
    const template = await templateRepository.create({ userId, ...input });
    return formatTemplate(template);
  },

  async update(userId: string, templateId: string, input: UpdateTemplateInput) {
    const existing = await templateRepository.findById(templateId);
    if (!existing || existing.userId !== userId) {
      throw new TemplateError("テンプレートが見つかりません", "NOT_FOUND");
    }

    const template = await templateRepository.update(templateId, input);
    return formatTemplate(template);
  },

  async delete(userId: string, templateId: string) {
    const existing = await templateRepository.findById(templateId);
    if (!existing || existing.userId !== userId) {
      throw new TemplateError("テンプレートが見つかりません", "NOT_FOUND");
    }

    await templateRepository.delete(templateId);
  },

  async setDefault(userId: string, templateId: string) {
    const existing = await templateRepository.findById(templateId);
    if (!existing || existing.userId !== userId) {
      throw new TemplateError("テンプレートが見つかりません", "NOT_FOUND");
    }

    const [, template] = await templateRepository.setDefault(userId, templateId);
    return formatTemplate(template);
  },
};
