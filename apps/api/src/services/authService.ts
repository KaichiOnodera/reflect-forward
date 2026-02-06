import { userRepository } from "../repositories/userRepository.js";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiresAt,
} from "../lib/jwt.js";

export interface RegisterInput {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
  tokens: AuthTokens;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: "EMAIL_EXISTS" | "INVALID_CREDENTIALS" | "INVALID_TOKEN"
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new AuthError("Email already registered", "EMAIL_EXISTS");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    });

    const tokens = await this.createTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      tokens,
    };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const isValid = await verifyPassword(input.password, user.passwordHash);
    if (!isValid) {
      throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS");
    }

    const tokens = await this.createTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
      tokens,
    };
  },

  async refresh(token: string): Promise<AuthTokens> {
    const storedToken = await refreshTokenRepository.findByToken(token);
    if (!storedToken) {
      throw new AuthError("Invalid refresh token", "INVALID_TOKEN");
    }

    if (storedToken.expiresAt < new Date()) {
      await refreshTokenRepository.deleteByToken(token);
      throw new AuthError("Refresh token expired", "INVALID_TOKEN");
    }

    await refreshTokenRepository.deleteByToken(token);

    return this.createTokens(storedToken.user.id, storedToken.user.email);
  },

  async logout(token: string): Promise<void> {
    try {
      await refreshTokenRepository.deleteByToken(token);
    } catch {
      // トークンが存在しない場合もあるので無視
    }
  },

  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };
  },

  async createTokens(userId: string, email: string): Promise<AuthTokens> {
    const accessToken = generateAccessToken({ userId, email });
    const refreshToken = generateRefreshToken();

    await refreshTokenRepository.create({
      userId,
      token: refreshToken,
      expiresAt: getRefreshTokenExpiresAt(),
    });

    return { accessToken, refreshToken };
  },
};
