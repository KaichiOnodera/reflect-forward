import { describe, it, expect, vi, beforeEach } from "vitest";
import { entryService, EntryError } from "../entryService.js";
import { entryRepository } from "../../repositories/entryRepository.js";

vi.mock("../../repositories/entryRepository.js", () => ({
  entryRepository: {
    findByUserId: vi.fn(),
    countByUserId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getCalendarData: vi.fn(),
  },
}));

const mockEntry = {
  id: "entry-1",
  userId: "user-1",
  content: "今日の内容",
  shortMemo: "良い一日",
  rating: 4,
  entryDate: new Date("2026-02-10"),
  createdAt: new Date("2026-02-10T10:00:00Z"),
  updatedAt: new Date("2026-02-10T10:00:00Z"),
};

describe("entryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("一覧とページネーション情報を返す", async () => {
      vi.mocked(entryRepository.findByUserId).mockResolvedValue([mockEntry]);
      vi.mocked(entryRepository.countByUserId).mockResolvedValue(1);

      const result = await entryService.list("user-1", { page: 1, limit: 20 });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].id).toBe("entry-1");
      expect(result.entries[0].entryDate).toBe("2026-02-10");
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it("totalPages を正しく計算する", async () => {
      vi.mocked(entryRepository.findByUserId).mockResolvedValue([]);
      vi.mocked(entryRepository.countByUserId).mockResolvedValue(45);

      const result = await entryService.list("user-1", { page: 1, limit: 20 });

      expect(result.pagination.totalPages).toBe(3);
    });

    it("フィルタ条件をリポジトリに渡す", async () => {
      vi.mocked(entryRepository.findByUserId).mockResolvedValue([]);
      vi.mocked(entryRepository.countByUserId).mockResolvedValue(0);

      await entryService.list("user-1", {
        page: 2,
        limit: 10,
        from: "2026-01-01",
        to: "2026-01-31",
        rating: 5,
      });

      expect(entryRepository.findByUserId).toHaveBeenCalledWith("user-1", {
        page: 2,
        limit: 10,
        from: "2026-01-01",
        to: "2026-01-31",
        rating: 5,
      });
    });
  });

  describe("getById", () => {
    it("自分の日記を取得できる", async () => {
      vi.mocked(entryRepository.findById).mockResolvedValue(mockEntry);

      const result = await entryService.getById("user-1", "entry-1");

      expect(result.id).toBe("entry-1");
      expect(result.entryDate).toBe("2026-02-10");
      expect(result.createdAt).toBe("2026-02-10T10:00:00.000Z");
    });

    it("存在しない日記で EntryError を投げる", async () => {
      vi.mocked(entryRepository.findById).mockResolvedValue(null);

      await expect(entryService.getById("user-1", "nonexistent")).rejects.toThrow(EntryError);
      await expect(entryService.getById("user-1", "nonexistent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("他ユーザーの日記で EntryError を投げる", async () => {
      vi.mocked(entryRepository.findById).mockResolvedValue(mockEntry);

      await expect(entryService.getById("other-user", "entry-1")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("create", () => {
    it("日記を作成して返す", async () => {
      vi.mocked(entryRepository.create).mockResolvedValue(mockEntry);

      const result = await entryService.create("user-1", {
        content: "今日の内容",
        shortMemo: "良い一日",
        rating: 4,
        entryDate: "2026-02-10",
      });

      expect(result.id).toBe("entry-1");
      expect(entryRepository.create).toHaveBeenCalledWith({
        userId: "user-1",
        content: "今日の内容",
        shortMemo: "良い一日",
        rating: 4,
        entryDate: "2026-02-10",
      });
    });
  });

  describe("update", () => {
    it("自分の日記を更新できる", async () => {
      const updatedEntry = { ...mockEntry, shortMemo: "更新後のメモ" };
      vi.mocked(entryRepository.findById).mockResolvedValue(mockEntry);
      vi.mocked(entryRepository.update).mockResolvedValue(updatedEntry);

      const result = await entryService.update("user-1", "entry-1", {
        shortMemo: "更新後のメモ",
      });

      expect(result.shortMemo).toBe("更新後のメモ");
      expect(entryRepository.update).toHaveBeenCalledWith("entry-1", {
        shortMemo: "更新後のメモ",
      });
    });

    it("存在しない日記の更新で EntryError を投げる", async () => {
      vi.mocked(entryRepository.findById).mockResolvedValue(null);

      await expect(
        entryService.update("user-1", "nonexistent", { shortMemo: "test" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("他ユーザーの日記の更新で EntryError を投げる", async () => {
      vi.mocked(entryRepository.findById).mockResolvedValue(mockEntry);

      await expect(
        entryService.update("other-user", "entry-1", { shortMemo: "test" })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("delete", () => {
    it("自分の日記を削除できる", async () => {
      vi.mocked(entryRepository.findById).mockResolvedValue(mockEntry);
      vi.mocked(entryRepository.delete).mockResolvedValue(mockEntry);

      await entryService.delete("user-1", "entry-1");

      expect(entryRepository.delete).toHaveBeenCalledWith("entry-1");
    });

    it("存在しない日記の削除で EntryError を投げる", async () => {
      vi.mocked(entryRepository.findById).mockResolvedValue(null);

      await expect(entryService.delete("user-1", "nonexistent")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("他ユーザーの日記の削除で EntryError を投げる", async () => {
      vi.mocked(entryRepository.findById).mockResolvedValue(mockEntry);

      await expect(entryService.delete("other-user", "entry-1")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("getCalendar", () => {
    it("カレンダーデータを整形して返す", async () => {
      vi.mocked(entryRepository.getCalendarData).mockResolvedValue([
        {
          entryDate: new Date("2026-02-05"),
          _count: { id: 1 },
          _avg: { rating: 4.5 },
        },
        {
          entryDate: new Date("2026-02-10"),
          _count: { id: 2 },
          _avg: { rating: 3.0 },
        },
      ]);

      const result = await entryService.getCalendar("user-1", 2026, 2);

      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toEqual({
        date: "2026-02-05",
        count: 1,
        avgRating: 4.5,
      });
      expect(result.entries[1]).toEqual({
        date: "2026-02-10",
        count: 2,
        avgRating: 3,
      });
    });

    it("評価なしの場合 avgRating が null になる", async () => {
      vi.mocked(entryRepository.getCalendarData).mockResolvedValue([
        {
          entryDate: new Date("2026-02-01"),
          _count: { id: 1 },
          _avg: { rating: null },
        },
      ]);

      const result = await entryService.getCalendar("user-1", 2026, 2);

      expect(result.entries[0].avgRating).toBeNull();
    });
  });
});
