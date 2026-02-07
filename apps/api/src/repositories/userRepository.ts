import { prisma } from "../lib/prisma.js";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  displayName?: string;
}

export const userRepository = {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  async create(data: CreateUserData) {
    return prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        displayName: data.displayName,
      },
    });
  },
};
