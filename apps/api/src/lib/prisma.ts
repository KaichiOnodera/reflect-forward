import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

type ExtendedClient = ReturnType<typeof createPrismaClient>;

function createPrismaClient(url: string) {
  return new PrismaClient({
    datasources: { db: { url } },
  }).$extends(withAccelerate());
}

let _url: string | undefined;
let _client: ExtendedClient | undefined;

// CF Workers では process.env が使えないため、リクエスト時に env.DATABASE_URL を注入する
export function initPrismaUrl(url: string) {
  if (_url !== url) {
    _url = url;
    _client = undefined;
  }
}

export const prisma = new Proxy({} as ExtendedClient, {
  get(_, prop: string | symbol) {
    if (!_client) {
      if (!_url)
        throw new Error("DATABASE_URL が未設定です。initPrismaUrl() を先に呼んでください。");
      _client = createPrismaClient(_url);
    }
    return Reflect.get(_client, prop);
  },
});
