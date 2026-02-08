import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  listEntriesQuerySchema,
  createEntrySchema,
  updateEntrySchema,
  calendarQuerySchema,
} from "@reflect-forward/shared";
import { entryService, EntryError } from "../services/entryService.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../types/context.js";

const entries = new Hono<{ Variables: Variables }>();

entries.use("*", authMiddleware);

entries.get("/", zValidator("query", listEntriesQuerySchema), async (c) => {
  const { userId } = c.get("user");
  const query = c.req.valid("query");

  const result = await entryService.list(userId, query);
  return c.json(result);
});

entries.post("/", zValidator("json", createEntrySchema), async (c) => {
  const { userId } = c.get("user");
  const input = c.req.valid("json");

  const entry = await entryService.create(userId, input);
  return c.json({ entry }, 201);
});

entries.get("/calendar", zValidator("query", calendarQuerySchema), async (c) => {
  const { userId } = c.get("user");
  const { year, month } = c.req.valid("query");

  const result = await entryService.getCalendar(userId, year, month);
  return c.json(result);
});

entries.get("/:id", async (c) => {
  const { userId } = c.get("user");
  const entryId = c.req.param("id");

  try {
    const entry = await entryService.getById(userId, entryId);
    return c.json({ entry });
  } catch (error) {
    if (error instanceof EntryError && error.code === "NOT_FOUND") {
      return c.json({ error: error.message }, 404);
    }
    throw error;
  }
});

entries.put("/:id", zValidator("json", updateEntrySchema), async (c) => {
  const { userId } = c.get("user");
  const entryId = c.req.param("id");
  const input = c.req.valid("json");

  try {
    const entry = await entryService.update(userId, entryId, input);
    return c.json({ entry });
  } catch (error) {
    if (error instanceof EntryError && error.code === "NOT_FOUND") {
      return c.json({ error: error.message }, 404);
    }
    throw error;
  }
});

entries.delete("/:id", async (c) => {
  const { userId } = c.get("user");
  const entryId = c.req.param("id");

  try {
    await entryService.delete(userId, entryId);
    return c.json({ message: "日記を削除しました" });
  } catch (error) {
    if (error instanceof EntryError && error.code === "NOT_FOUND") {
      return c.json({ error: error.message }, 404);
    }
    throw error;
  }
});

export default entries;
