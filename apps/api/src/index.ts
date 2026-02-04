import { serve } from "@hono/node-server";
import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

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

// TODO: Add routes
// app.route("/api/auth", authRoutes);
// app.route("/api/entries", entriesRoutes);

const port = Number(process.env.PORT) || 3001;

serve(
  {
    fetch: app.fetch,
    port,
  },
  () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
  }
);

export default app;
