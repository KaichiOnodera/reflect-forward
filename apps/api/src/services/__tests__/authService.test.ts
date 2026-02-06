import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService, AuthError } from "../authService.js";
import { userRepository } from "../../repositories/userRepository.js";
import { refreshTokenRepository } from "../../repositories/refreshTokenRepository.js";
import * as password from "../../lib/password.js";
import * as jwt from "../../lib/jwt.js";

// Mock repositories and libs
vi.mock("../../repositories/userRepository.js", () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../../repositories/refreshTokenRepository.js", () => ({
  refreshTokenRepository: {
    create: vi.fn(),
    findByToken: vi.fn(),
    deleteByToken: vi.fn(),
    deleteByUserId: vi.fn(),
  },
}));

vi.mock("../../lib/password.js", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("../../lib/jwt.js", () => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  getRefreshTokenExpiresAt: vi.fn(),
}));

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        displayName: "Test User",
        passwordHash: "hashed-password",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
      vi.mocked(password.hashPassword).mockResolvedValue("hashed-password");
      vi.mocked(userRepository.create).mockResolvedValue(mockUser);
      vi.mocked(jwt.generateAccessToken).mockReturnValue("access-token");
      vi.mocked(jwt.generateRefreshToken).mockReturnValue("refresh-token");
      vi.mocked(jwt.getRefreshTokenExpiresAt).mockReturnValue(new Date());
      vi.mocked(refreshTokenRepository.create).mockResolvedValue({
        id: "token-123",
        userId: "user-123",
        token: "refresh-token",
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await authService.register({
        email: "test@example.com",
        password: "password123",
        displayName: "Test User",
      });

      expect(result.user.email).toBe("test@example.com");
      expect(result.user.displayName).toBe("Test User");
      expect(result.tokens.accessToken).toBe("access-token");
      expect(result.tokens.refreshToken).toBe("refresh-token");
      expect(userRepository.findByEmail).toHaveBeenCalledWith("test@example.com");
      expect(password.hashPassword).toHaveBeenCalledWith("password123");
    });

    it("should throw error if email already exists", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        id: "existing-user",
        email: "test@example.com",
        displayName: null,
        passwordHash: "hash",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        authService.register({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toThrow(AuthError);

      await expect(
        authService.register({
          email: "test@example.com",
          password: "password123",
        })
      ).rejects.toMatchObject({ code: "EMAIL_EXISTS" });
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        displayName: "Test User",
        passwordHash: "hashed-password",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(userRepository.findByEmail).mockResolvedValue(mockUser);
      vi.mocked(password.verifyPassword).mockResolvedValue(true);
      vi.mocked(jwt.generateAccessToken).mockReturnValue("access-token");
      vi.mocked(jwt.generateRefreshToken).mockReturnValue("refresh-token");
      vi.mocked(jwt.getRefreshTokenExpiresAt).mockReturnValue(new Date());
      vi.mocked(refreshTokenRepository.create).mockResolvedValue({
        id: "token-123",
        userId: "user-123",
        token: "refresh-token",
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await authService.login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result.user.email).toBe("test@example.com");
      expect(result.tokens.accessToken).toBe("access-token");
      expect(password.verifyPassword).toHaveBeenCalledWith("password123", "hashed-password");
    });

    it("should throw error if user not found", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

      await expect(
        authService.login({
          email: "nonexistent@example.com",
          password: "password123",
        })
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    });

    it("should throw error if password is invalid", async () => {
      vi.mocked(userRepository.findByEmail).mockResolvedValue({
        id: "user-123",
        email: "test@example.com",
        displayName: null,
        passwordHash: "hashed-password",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(password.verifyPassword).mockResolvedValue(false);

      await expect(
        authService.login({
          email: "test@example.com",
          password: "wrong-password",
        })
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    });
  });

  describe("refresh", () => {
    it("should refresh tokens successfully", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue({
        id: "token-123",
        userId: "user-123",
        token: "old-refresh-token",
        expiresAt: futureDate,
        createdAt: new Date(),
        user: {
          id: "user-123",
          email: "test@example.com",
          displayName: null,
          passwordHash: "hash",
          avatarUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue({
        id: "token-123",
        userId: "user-123",
        token: "old-refresh-token",
        expiresAt: futureDate,
        createdAt: new Date(),
      });
      vi.mocked(jwt.generateAccessToken).mockReturnValue("new-access-token");
      vi.mocked(jwt.generateRefreshToken).mockReturnValue("new-refresh-token");
      vi.mocked(jwt.getRefreshTokenExpiresAt).mockReturnValue(new Date());
      vi.mocked(refreshTokenRepository.create).mockResolvedValue({
        id: "new-token-123",
        userId: "user-123",
        token: "new-refresh-token",
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const result = await authService.refresh("old-refresh-token");

      expect(result.accessToken).toBe("new-access-token");
      expect(result.refreshToken).toBe("new-refresh-token");
      expect(refreshTokenRepository.deleteByToken).toHaveBeenCalledWith("old-refresh-token");
    });

    it("should throw error if refresh token not found", async () => {
      vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue(null);

      await expect(authService.refresh("invalid-token")).rejects.toMatchObject({
        code: "INVALID_TOKEN",
      });
    });

    it("should throw error if refresh token is expired", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      vi.mocked(refreshTokenRepository.findByToken).mockResolvedValue({
        id: "token-123",
        userId: "user-123",
        token: "expired-token",
        expiresAt: pastDate,
        createdAt: new Date(),
        user: {
          id: "user-123",
          email: "test@example.com",
          displayName: null,
          passwordHash: "hash",
          avatarUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      vi.mocked(refreshTokenRepository.deleteByToken).mockResolvedValue({
        id: "token-123",
        userId: "user-123",
        token: "expired-token",
        expiresAt: pastDate,
        createdAt: new Date(),
      });

      await expect(authService.refresh("expired-token")).rejects.toMatchObject({
        code: "INVALID_TOKEN",
      });
    });
  });
});
