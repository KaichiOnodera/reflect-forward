# 本番デプロイ — 設計

## 概要

本番デプロイに必要な作業は大きく以下の3領域に分かれる。

1. **コード変更**: Vercel サーバーレス対応のための API エントリポイント改修・設定ファイル追加
2. **インフラ構築**: Supabase DB 作成・Vercel プロジェクト作成
3. **動作確認**: 本番環境での E2E テスト

---

## 1. API サーバーレス対応（コード変更）

### 背景・課題

現在の `apps/api/src/index.ts` は `@hono/node-server` の `serve()` で常駐サーバーとして起動する実装になっている。
Vercel はサーバーレス関数として動作するため、`serve()` をそのままデプロイすることはできない。

```
現状                        変更後
─────────────────────       ─────────────────────────────
src/index.ts                src/app.ts   ← Hono アプリ定義のみ
 └─ Hono アプリ定義    →    src/index.ts ← ローカル開発用（serve()）
 └─ serve() 起動            api/index.ts ← Vercel 用エントリポイント
```

### 変更方針

`src/index.ts` を以下の2ファイルに分離する。

#### `src/app.ts`（新規）— Hono アプリ本体

ミドルウェア・ルート定義のみを持ち、`serve()` は呼ばない。
ローカル・本番の両方から import される。

#### `src/index.ts`（変更）— ローカル開発用

`src/app.ts` を import して `serve()` で起動するだけのファイルに変更する。

#### `api/index.ts`（新規）— Vercel サーバーレスエントリポイント

Hono が提供する `handle()` を使って Vercel 向けのハンドラをエクスポートする。

```ts
import { handle } from 'hono/vercel'
import app from '../src/app'

export const config = { runtime: 'nodejs' }
export default handle(app)
```

### `apps/api/vercel.json`（新規）

Vercel に対してルーティングと Node.js ランタイムを指定する。

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
}
```

---

## 2. Vercel プロジェクト設定

### Web（apps/web）

Vercel は Next.js を自動検出するため、追加設定は最小限で済む。

| 設定項目 | 値 |
|----------|-----|
| Framework Preset | Next.js（自動検出） |
| Root Directory | `apps/web` |
| Build Command | `cd ../.. && pnpm build --filter=web` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |

> Root Directory を `apps/web` にすると `pnpm install` がそのディレクトリで実行されてしまう。
> ワークスペース依存（`@reflect-forward/shared` 等）を解決するため、必ずルートから実行する。

**環境変数（Vercel ダッシュボードで設定）**

| 変数名 | 値 |
|--------|----|
| `NEXT_PUBLIC_API_URL` | API の Vercel デプロイ URL |

### API（apps/api）

| 設定項目 | 値 |
|----------|-----|
| Framework Preset | Other |
| Root Directory | `apps/api` |
| Build Command | `cd ../.. && pnpm --filter=api exec prisma generate && pnpm build --filter=api` |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |

> `prisma generate` を build より前に実行しないと Prisma クライアントが存在せず実行時エラーになる。
> Install Command も Web と同様にルートから実行する。

**環境変数（Vercel ダッシュボードで設定）**

| 変数名 | 値 |
|--------|----|
| `DATABASE_URL` | Supabase 接続文字列 |
| `JWT_SECRET` | ランダム生成した強力な文字列（32文字以上） |
| `JWT_EXPIRES_IN` | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | Web の Vercel デプロイ URL |
| `NODE_ENV` | `production` |

---

## 3. Supabase DB 構築

### 手順

1. Supabase プロジェクトを作成（リージョン: Northeast Asia / Tokyo）
2. `DATABASE_URL`（接続文字列）を取得
3. `apps/api` で以下を実行してスキーマを本番 DB に反映

```bash
cd apps/api
DATABASE_URL=<本番接続文字列> pnpm prisma migrate deploy
```

> `prisma db push` ではなく `prisma migrate deploy` を使う。
> `db push` はスキーマ強制反映でデータ損失リスクがあるため、本番では使用しない。

---

## 4. デプロイ順序

CORS_ORIGIN の URL 確定を先にするため、Web → API の順でデプロイする。

```
1. Supabase DB 作成・マイグレーション適用
      ↓
2. Vercel に Web プロジェクトを作成・デプロイ
   → Web の URL が確定する（例: https://reflect-forward.vercel.app）
      ↓
3. Vercel に API プロジェクトを作成
   → 環境変数に CORS_ORIGIN = Web の URL を設定してからデプロイ
      ↓
4. Web の環境変数に NEXT_PUBLIC_API_URL = API の URL を設定して再デプロイ
      ↓
5. E2E 動作確認
```

---

## 5. 変更ファイル一覧

| ファイル | 種別 | 内容 |
|----------|------|------|
| `apps/api/src/app.ts` | 新規 | Hono アプリ定義（serve なし） |
| `apps/api/src/index.ts` | 変更 | ローカル開発用（app.ts を import して serve） |
| `apps/api/api/index.ts` | 新規 | Vercel サーバーレスエントリポイント |
| `apps/api/vercel.json` | 新規 | Vercel ルーティング設定 |
| `apps/api/tsconfig.json` | 変更 | `rootDir` を削除し `api/` ディレクトリも型チェック対象に含める |

---

## 6. 影響範囲

- ローカル開発: `pnpm dev` の動作は変わらない（`src/index.ts` は従来通り）
- テスト: 変更なし（サービス層・リポジトリ層は触らない）
- 既存 API の挙動: 変更なし（ルート定義を `app.ts` に移すだけ）
