/** DB モデル（Prisma から取得した生データ） */
export interface UserModel {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** API レスポンス用 DTO（JSON シリアライズ可能） */
export interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}
