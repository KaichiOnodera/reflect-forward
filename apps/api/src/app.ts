import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Bindings } from "./types/context.js";
import { initPrismaUrl } from "./lib/prisma.js";
import authRoutes from "./routes/auth.js";
import entriesRoutes from "./routes/entries.js";
import templatesRoutes from "./routes/templates.js";

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", logger());
// CF Workers ではリクエスト時の env から DATABASE_URL を Prisma に注入する
app.use("*", (c, next) => {
  initPrismaUrl(c.env.DATABASE_URL);
  return next();
});
app.use("*", (c, next) => {
  const origin = c.env.CORS_ORIGIN;
  if (!origin && c.env.NODE_ENV === "production") {
    console.warn("CORS_ORIGIN is not set in production environment");
  }
  return cors({
    origin: origin || "http://localhost:3000",
    credentials: true,
  })(c, next);
});

// Health check
app.get("/", (c) => {
  return c.json({ message: "Reflect Forward API", status: "ok" });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy" });
});

// Global error handler
app.onError((err: Error, c: Context) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/entries", entriesRoutes);
app.route("/api/templates", templatesRoutes);

export default app;
