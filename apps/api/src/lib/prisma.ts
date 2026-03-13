import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

type ExtendedClient = ReturnType<typeof createPrismaClient>;

function createPrismaClient() {
  return new PrismaClient().$extends(withAccelerate());
}

let _client: ExtendedClient | undefined;

// CF Workers ではモジュールロード時に process.env（シークレット）が利用できないため、
// 初回アクセス時にクライアントを生成する Proxy を使用して遅延初期化する
export const prisma = new Proxy({} as ExtendedClient, {
  get(_, prop: string | symbol) {
    if (!_client) {
      _client = createPrismaClient();
    }
    return Reflect.get(_client, prop);
  },
});
