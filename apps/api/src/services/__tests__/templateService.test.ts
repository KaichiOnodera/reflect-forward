import { describe, it, expect, vi, beforeEach } from "vitest";
import { templateService, TemplateError } from "../templateService.js";
import { templateRepository } from "../../repositories/templateRepository.js";

vi.mock("../../repositories/templateRepository.js", () => ({
  templateRepository: {
    findByUserId: vi.fn(),
    findById: vi.fn(),
    findDefault: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    setDefault: vi.fn(),
  },
}));

const mockTemplate = {
  id: "template-1",
  userId: "user-1",
  name: "振り返りテンプレート",
  content: "## 今日の振り返り\n\n### よかったこと\n\n### 改善点\n",
  isDefault: false,
  createdAt: new Date("2026-03-01T10:00:00Z"),
  updatedAt: new Date("2026-03-01T10:00:00Z"),
};

describe("templateService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("テンプレート一覧を返す", async () => {
      vi.mocked(templateRepository.findByUserId).mockResolvedValue([mockTemplate]);

      const result = await templateService.list("user-1");

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].id).toBe("template-1");
      expect(result.templates[0].createdAt).toBe("2026-03-01T10:00:00.000Z");
    });

    it("テンプレートが0件の場合は空配列を返す", async () => {
      vi.mocked(templateRepository.findByUserId).mockResolvedValue([]);

      const result = await templateService.list("user-1");

      expect(result.templates).toHaveLength(0);
    });
  });

  describe("getById", () => {
    it("自分のテンプレートを取得できる", async () => {
      vi.mocked(templateRepository.findById).mockResolvedValue(mockTemplate);

      const result = await templateService.getById("user-1", "template-1");

      expect(result.id).toBe("template-1");
      expect(result.name).toBe("振り返りテンプレート");
    });

    it("存在しないテンプレートで TemplateError を投げる", async () => {
      vi.mocked(templateRepository.findById).mockResolvedValue(null);

      await expect(templateService.getById("user-1", "nonexistent")).rejects.toThrow(TemplateError);
      await expect(templateService.getById("user-1", "nonexistent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("他ユーザーのテンプレートで TemplateError を投げる", async () => {
      vi.mocked(templateRepository.findById).mockResolvedValue(mockTemplate);

      await expect(templateService.getById("other-user", "template-1")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("getDefault", () => {
    it("デフォルトテンプレートを返す", async () => {
      const defaultTemplate = { ...mockTemplate, isDefault: true };
      vi.mocked(templateRepository.findDefault).mockResolvedValue(defaultTemplate);

      const result = await templateService.getDefault("user-1");

      expect(result.isDefault).toBe(true);
    });

    it("デフォルト未設定で TemplateError を投げる", async () => {
      vi.mocked(templateRepository.findDefault).mockResolvedValue(null);

      await expect(templateService.getDefault("user-1")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("create", () => {
    it("テンプレートを作成して返す", async () => {
      vi.mocked(templateRepository.create).mockResolvedValue(mockTemplate);

      const result = await templateService.create("user-1", {
        name: "振り返りテンプレート",
        content: "## 今日の振り返り\n",
      });

      expect(result.id).toBe("template-1");
      expect(templateRepository.create).toHaveBeenCalledWith({
        userId: "user-1",
        name: "振り返りテンプレート",
        content: "## 今日の振り返り\n",
      });
    });
  });

  describe("update", () => {
    it("自分のテンプレートを更新できる", async () => {
      const updatedTemplate = { ...mockTemplate, name: "更新後の名前" };
      vi.mocked(templateRepository.findById).mockResolvedValue(mockTemplate);
      vi.mocked(templateRepository.update).mockResolvedValue(updatedTemplate);

      const result = await templateService.update("user-1", "template-1", {
        name: "更新後の名前",
      });

      expect(result.name).toBe("更新後の名前");
      expect(templateRepository.update).toHaveBeenCalledWith("template-1", {
        name: "更新後の名前",
      });
    });

    it("存在しないテンプレートの更新で TemplateError を投げる", async () => {
      vi.mocked(templateRepository.findById).mockResolvedValue(null);

      await expect(
        templateService.update("user-1", "nonexistent", { name: "test" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("他ユーザーのテンプレートの更新で TemplateError を投げる", async () => {
      vi.mocked(templateRepository.findById).mockResolvedValue(mockTemplate);

      await expect(
        templateService.update("other-user", "template-1", { name: "test" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("delete", () => {
    it("自分のテンプレートを削除できる", async () => {
      vi.mocked(templateRepository.findById).mockResolvedValue(mockTemplate);
      vi.mocked(templateRepository.delete).mockResolvedValue(mockTemplate);

      await templateService.delete("user-1", "template-1");

      expect(templateRepository.delete).toHaveBeenCalledWith("template-1");
    });

    it("存在しないテンプレートの削除で TemplateError を投げる", async () => {
      vi.mocked(templateRepository.findById).mockResolvedValue(null);

      await expect(templateService.delete("user-1", "nonexistent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("他ユーザーのテンプレートの削除で TemplateError を投げる", async () => {
      vi.mocked(templateRepository.findById).mockResolvedValue(mockTemplate);

      await expect(templateService.delete("other-user", "template-1")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("setDefault", () => {
    it("デフォルトテンプレートを設定して返す", async () => {
      const defaultTemplate = { ...mockTemplate, isDefault: true };
      vi.mocked(templateRepository.findById).mockResolvedValue(mockTemplate);
      vi.mocked(templateRepository.setDefault).mockResolvedValue([
        { count: 1 },
        defaultTemplate,
      ] as [{ count: number }, typeof defaultTemplate]);

      const result = await templateService.setDefault("user-1", "template-1");

      expect(result.isDefault).toBe(true);
      expect(templateRepository.setDefault).toHaveBeenCalledWith("user-1", "template-1");
    });

    it("存在しないテンプレートで TemplateError を投げる", async () => {
      vi.mocked(templateRepository.findById).mockResolvedValue(null);

      await expect(templateService.setDefault("user-1", "nonexistent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("他ユーザーのテンプレートで TemplateError を投げる", async () => {
      vi.mocked(templateRepository.findById).mockResolvedValue(mockTemplate);

      await expect(
        templateService.setDefault("other-user", "template-1")
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
