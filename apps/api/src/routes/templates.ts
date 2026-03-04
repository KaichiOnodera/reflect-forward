import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createTemplateSchema,
  updateTemplateSchema,
  templateIdParamSchema,
} from "@reflect-forward/shared";
import { templateService, TemplateError } from "../services/templateService.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../types/context.js";

const templates = new Hono<{ Variables: Variables }>();

templates.use("*", authMiddleware);

templates.get("/", async (c) => {
  const { userId } = c.get("user");
  const result = await templateService.list(userId);
  return c.json(result);
});

templates.post("/", zValidator("json", createTemplateSchema), async (c) => {
  const { userId } = c.get("user");
  const input = c.req.valid("json");

  const template = await templateService.create(userId, input);
  return c.json({ template }, 201);
});

// 静的パス /default は /:id より先に定義する
templates.get("/default", async (c) => {
  const { userId } = c.get("user");

  try {
    const template = await templateService.getDefault(userId);
    return c.json({ template });
  } catch (error) {
    if (error instanceof TemplateError && error.code === "NOT_FOUND") {
      return c.json({ error: error.message }, 404);
    }
    throw error;
  }
});

templates.get("/:id", zValidator("param", templateIdParamSchema), async (c) => {
  const { userId } = c.get("user");
  const { id: templateId } = c.req.valid("param");

  try {
    const template = await templateService.getById(userId, templateId);
    return c.json({ template });
  } catch (error) {
    if (error instanceof TemplateError && error.code === "NOT_FOUND") {
      return c.json({ error: error.message }, 404);
    }
    throw error;
  }
});

templates.put(
  "/:id",
  zValidator("param", templateIdParamSchema),
  zValidator("json", updateTemplateSchema),
  async (c) => {
    const { userId } = c.get("user");
    const { id: templateId } = c.req.valid("param");
    const input = c.req.valid("json");

    try {
      const template = await templateService.update(userId, templateId, input);
      return c.json({ template });
    } catch (error) {
      if (error instanceof TemplateError && error.code === "NOT_FOUND") {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  }
);

templates.delete("/:id", zValidator("param", templateIdParamSchema), async (c) => {
  const { userId } = c.get("user");
  const { id: templateId } = c.req.valid("param");

  try {
    await templateService.delete(userId, templateId);
    return c.json({ message: "テンプレートを削除しました" });
  } catch (error) {
    if (error instanceof TemplateError && error.code === "NOT_FOUND") {
      return c.json({ error: error.message }, 404);
    }
    throw error;
  }
});

templates.put("/:id/default", zValidator("param", templateIdParamSchema), async (c) => {
  const { userId } = c.get("user");
  const { id: templateId } = c.req.valid("param");

  try {
    const template = await templateService.setDefault(userId, templateId);
    return c.json({ template });
  } catch (error) {
    if (error instanceof TemplateError && error.code === "NOT_FOUND") {
      return c.json({ error: error.message }, 404);
    }
    throw error;
  }
});

export default templates;
