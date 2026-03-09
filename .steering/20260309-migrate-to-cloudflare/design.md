# Cloudflare 移行 — 設計

## 概要

本作業の変更は大きく以下の4領域に分かれる。

1. **バックエンド**: Hono アプリを CF Workers 対応に改修
2. **フロントエンド**: Next.js を CF Pages 対応に改修
3. **インフラ**: Prisma Accelerate・Supabase・CF Workers/Pages のセットアップ
4. **ドキュメント**: ADR-0006 の改訂

---

## 1. バックエンド（Cloudflare Workers 対応）

### 1-1. Hono アプリのエントリポイント分離

現在の `apps/api/src/index.ts` は `@hono/node-server` の `serve()` で起動する実装になっている。
CF Workers はリクエストハンドラを `export default` するモデルのため、`serve()` を分離する。

```
変更前                       変更後
──────────────────────       ──────────────────────────────────
src/index.ts                 src/app.ts   ← Hono アプリ定義のみ
 └─ Hono アプリ定義    →     src/index.ts ← ローカル開発用（serve()）
 └─ serve() 起動             src/worker.ts ← CF Workers エントリポイント
```

#### `src/app.ts`（新規）— Hono アプリ本体

ミドルウェア・ルート定義のみを持ち、`serve()` は呼ばない。
ローカル（`index.ts`）と CF Workers（`worker.ts`）の両方から import される。

```ts
import { Hono } from 'hono'
// middleware + routes のみ定義
export default app
```

#### `src/index.ts`（変更）— ローカル開発用

`app.ts` を import して `serve()` で起動するだけに変更する。
`pnpm dev` の動作は変わらない。

#### `src/worker.ts`（新規）— CF Workers エントリポイント

```ts
import app from './app.js'
export default app
```

### 1-2. wrangler 設定

**`apps/api/wrangler.toml`**（新規）

```toml
name = "reflect-forward-api"
main = "src/worker.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]  # jsonwebtoken の crypto 対応

[vars]
NODE_ENV = "production"
```

`nodejs_compat` フラグにより、`jsonwebtoken` が依存する Node.js `crypto` モジュールが CF Workers 上で利用可能になる。

シークレットは `wrangler secret put` で設定する（ソースコードに含めない）。

### 1-3. Prisma Accelerate 導入

CF Workers は直接 TCP で PostgreSQL に接続できないため、HTTP ベースのプロキシである Prisma Accelerate を使用する。

**`apps/api/src/lib/prisma.ts`（変更）**

```ts
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

function createPrismaClient() {
  return new PrismaClient().$extends(withAccelerate())
}
```

`withAccelerate()` は `prisma+postgres://` スキーマの URL を検出したときのみ Accelerate 経由で動作する。ローカル開発時の `postgresql://` URL では no-op（透過的なパススルー）として動作するため、環境による分岐コードは不要。

**`apps/api/prisma/schema.prisma`（変更）**

Prisma Accelerate はクエリ実行に `DATABASE_URL`（Accelerate URL）を使い、マイグレーション実行には `directUrl`（Supabase 直接接続）を使う。これにより `prisma migrate deploy` が確実に動作する。

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // 本番: Accelerate URL / ローカル: 直接接続
  directUrl = env("DIRECT_DATABASE_URL") // Supabase 直接接続（マイグレーション用）
}
```

**環境変数:**

ローカル（`.env`）:
- `DATABASE_URL=postgresql://...`（Docker PostgreSQL 直接接続）
- `DIRECT_DATABASE_URL=postgresql://...`（同上・マイグレーション用、ローカルでは同じ値で可）

本番（CF Workers シークレット + Cloudflare ダッシュボード）:
- `DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=...`
- `DIRECT_DATABASE_URL=postgresql://...`（Supabase 直接接続文字列）

**追加パッケージ:**
- `@prisma/extension-accelerate`（dependencies に追加）
- `wrangler`（devDependencies に追加）

### 1-4. package.json スクリプト追加

```json
"deploy": "wrangler deploy",
"dev:worker": "wrangler dev"
```

---

## 2. フロントエンド（Cloudflare Pages 対応）

### 2-1. `@cloudflare/next-on-pages` 導入

Next.js を CF Pages 向けにビルドするアダプタを追加する。

```bash
pnpm add -D @cloudflare/next-on-pages --filter=web
```

**`apps/web/next.config.ts`（変更）**

開発時に CF Pages のローカルエミュレーションを有効化する設定を追加する。

```ts
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev'

if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform()
}
```

### 2-2. Edge Runtime 設定

CF Pages は Edge Runtime で動作するため、各 route segment（`layout.tsx` / `page.tsx`）に以下を追加する。

```ts
export const runtime = 'edge'
```

> **注意**: Edge Runtime では `fs` や一部の Node.js API が使えない。
> 現在の Web アプリは API 呼び出し・Cookie 操作・Tailwind CSS が中心であり、Edge Runtime 非互換の API は使用していないと想定されるが、デプロイ後に互換性を確認する。

### 2-3. wrangler 設定

**`apps/web/wrangler.toml`**（新規）

```toml
name = "reflect-forward-web"
pages_build_output_dir = ".vercel/output/static"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
```

### 2-4. package.json スクリプト追加

```json
"build:cf": "npx @cloudflare/next-on-pages",
"deploy": "npx @cloudflare/next-on-pages && wrangler pages deploy"
```

---

## 3. インフラセットアップ・デプロイ順序

CORS_ORIGIN の URL 確定を先にするため、以下の順序でデプロイする。

```
1. Prisma Accelerate セットアップ
   → console.prisma.io でプロジェクト作成・Supabase 接続
   → Accelerate 接続文字列（prisma+postgres://...）を取得
        ↓
2. Supabase マイグレーション適用
   → DIRECT_DATABASE_URL=<supabase_url> DATABASE_URL=<accelerate_url> pnpm prisma migrate deploy
   → （マイグレーションは directUrl 経由で Supabase に直接実行される）
        ↓
3. CF Workers デプロイ
   → wrangler secret put で環境変数を設定
   → wrangler deploy
   → Workers URL 確定（例: https://reflect-forward-api.<account>.workers.dev）
        ↓
4. CF Pages デプロイ
   → Cloudflare ダッシュボードで NEXT_PUBLIC_API_URL = Workers URL を設定
   → デプロイ
   → Pages URL 確定（例: https://reflect-forward-web.pages.dev）
        ↓
5. CF Workers の CORS_ORIGIN を Pages URL に更新
   → wrangler secret put CORS_ORIGIN
   → 再デプロイ不要（シークレット更新は即時反映）
        ↓
6. E2E 動作確認
```

### CF Workers シークレット一覧

```bash
wrangler secret put DATABASE_URL              # Prisma Accelerate URL
wrangler secret put DIRECT_DATABASE_URL      # Supabase 直接接続文字列（マイグレーション用）
wrangler secret put JWT_SECRET               # 32文字以上のランダム文字列
wrangler secret put JWT_EXPIRES_IN           # 15m
wrangler secret put REFRESH_TOKEN_EXPIRES_IN # 7d
wrangler secret put CORS_ORIGIN              # CF Pages URL（デプロイ後に設定）
```

---

## 4. ADR-0006 改訂

`docs/adr/0006-use-vercel-for-hosting.md` を改訂し、以下を記録する。

- ステータスを「採用」→「置き換え済み」に変更
- 新しい ADR（`0007-use-cloudflare-for-hosting.md`）を作成して Cloudflare 採用の理由・トレードオフを記録

---

## 5. 変更ファイル一覧

| ファイル | 種別 | 内容 |
|---------|------|------|
| `apps/api/src/app.ts` | 新規 | Hono アプリ定義（serve なし） |
| `apps/api/src/index.ts` | 変更 | ローカル開発用（app.ts を import して serve）|
| `apps/api/src/worker.ts` | 新規 | CF Workers エントリポイント |
| `apps/api/src/lib/prisma.ts` | 変更 | withAccelerate() 拡張を追加 |
| `apps/api/prisma/schema.prisma` | 変更 | `directUrl` を追加 |
| `apps/api/wrangler.toml` | 新規 | CF Workers 設定 |
| `apps/api/package.json` | 変更 | `@prisma/extension-accelerate`・`wrangler` 追加、スクリプト追加 |
| `apps/web/next.config.ts` | 変更 | next-on-pages の setupDevPlatform 追加 |
| `apps/web/wrangler.toml` | 新規 | CF Pages 設定 |
| `apps/web/package.json` | 変更 | `@cloudflare/next-on-pages` 追加、スクリプト追加 |
| `docs/adr/0006-use-vercel-for-hosting.md` | 変更 | ステータスを「置き換え済み」に改訂 |
| `docs/adr/0007-use-cloudflare-for-hosting.md` | 新規 | Cloudflare 採用の ADR |

---

## 6. 影響範囲

- **ローカル開発**: `pnpm dev` の動作は変わらない
- **テスト**: 変更なし（サービス層・リポジトリ層は触らない）
- **既存 API の挙動**: 変更なし（ルート定義を `app.ts` に移すだけ）
- **CI/CD**: GitHub Actions の lint/typecheck/test/build は既存のまま動作する（CF へのデプロイは手動または別途 workflow 追加）
