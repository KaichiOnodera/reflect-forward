import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "@reflect-forward/shared";
import { authService, AuthError } from "../services/authService.js";
import { authMiddleware } from "../middleware/auth.js";
import type { Variables } from "../types/context.js";

const auth = new Hono<{ Variables: Variables }>();

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const input = c.req.valid("json");

  try {
    const result = await authService.register(input);
    return c.json(result, 201);
  } catch (error) {
    if (error instanceof AuthError && error.code === "EMAIL_EXISTS") {
      return c.json({ error: error.message }, 409);
    }
    throw error;
  }
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const input = c.req.valid("json");

  try {
    const result = await authService.login(input);
    return c.json(result);
  } catch (error) {
    if (error instanceof AuthError && error.code === "INVALID_CREDENTIALS") {
      return c.json({ error: error.message }, 401);
    }
    throw error;
  }
});

auth.post("/refresh", zValidator("json", refreshTokenSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");

  try {
    const tokens = await authService.refresh(refreshToken);
    return c.json(tokens);
  } catch (error) {
    if (error instanceof AuthError && error.code === "INVALID_TOKEN") {
      return c.json({ error: error.message }, 401);
    }
    throw error;
  }
});

auth.post("/logout", zValidator("json", refreshTokenSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");

  await authService.logout(refreshToken);
  return c.json({ message: "Logged out successfully" });
});

auth.get("/me", authMiddleware, async (c) => {
  const { userId } = c.get("user");

  const user = await authService.getCurrentUser(userId);
  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(user);
});

export default auth;
