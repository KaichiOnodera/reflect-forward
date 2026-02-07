import type { MiddlewareHandler } from "hono";
import { verifyAccessToken } from "../lib/jwt.js";
import type { Variables } from "../types/context.js";

export const authMiddleware: MiddlewareHandler<{ Variables: Variables }> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Authorization header required" }, 401);
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  c.set("user", { userId: payload.userId, email: payload.email });

  await next();
};
