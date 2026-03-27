import type { Context } from "hono";

export interface AuthUser {
  userId: string;
  email: string;
}

export type Variables = {
  user: AuthUser;
};

export type AuthContext = Context<{ Variables: Variables }>;

export type Bindings = {
  DATABASE_URL: string;
  CORS_ORIGIN?: string;
  NODE_ENV?: string;
};
