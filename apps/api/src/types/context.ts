import type { Context } from "hono";

export interface AuthUser {
  userId: string;
  email: string;
}

export type Variables = {
  user: AuthUser;
};

export type AuthContext = Context<{ Variables: Variables }>;
