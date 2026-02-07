import { prisma } from "../lib/prisma.js";

export interface CreateRefreshTokenData {
  userId: string;
  token: string;
  expiresAt: Date;
}

export const refreshTokenRepository = {
  async create(data: CreateRefreshTokenData) {
    return prisma.refreshToken.create({
      data: {
        userId: data.userId,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    });
  },

  async findByToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  },

  async deleteByToken(token: string) {
    return prisma.refreshToken.deleteMany({
      where: { token },
    });
  },

  async deleteByUserId(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  },
};
