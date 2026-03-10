import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import authRoutes from "./routes/auth.js";
import entriesRoutes from "./routes/entries.js";
import templatesRoutes from "./routes/templates.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

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
