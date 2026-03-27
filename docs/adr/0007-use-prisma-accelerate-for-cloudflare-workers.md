# ADR-0007: Cloudflare Workers 対応のため Prisma Accelerate を採用

## ステータス

採用（ADR-0006 を部分的に更新）

## コンテキスト

ADR-0006 ではバックエンドホスティングに Vercel を採用し、Cloudflare Workers は「Prisma が Edge Runtime に非対応」として見送った。

その後、以下の理由により Cloudflare Workers への移行を決定した:

- Hono との相性が最良
- 無料枠が Vercel Hobby プランより寛大
- エッジ実行による低レイテンシ

しかし、Cloudflare Workers（Edge Runtime）では標準の `PrismaClient` が動作しない。`@prisma/extension-accelerate` はすでにインストール済みだったが、`DATABASE_URL` が通常の `postgresql://` 形式のままだったため、Prisma がEdge Runtime を検出して以下のエラーを投げていた:

```
PrismaClientValidationError: In order to run Prisma Client on edge runtime, either:
  - Use Prisma Accelerate: https://pris.ly/d/accelerate
  - Use Driver Adapters: https://pris.ly/d/driver-adapters
```

## 決定

Prisma Accelerate を採用し、`DATABASE_URL` を `prisma://` 形式の Accelerate URL に変更する。

- `DATABASE_URL`: Prisma Accelerate の接続 URL（`prisma://accelerate.prisma.io/?api_key=...`）
- `DIRECT_DATABASE_URL`: 既存の Supabase PostgreSQL URL（マイグレーション専用として継続使用）
- コードの変更は不要（`withAccelerate()` はすでに適用済み）

## 理由

- `@prisma/extension-accelerate` がすでにインストール済みで、追加パッケージ不要
- コード変更なしで対応できる（URL の差し替えのみ）
- 無料枠（月6万リクエスト）が個人プロジェクトの規模に十分
- `DIRECT_DATABASE_URL` を残すことでマイグレーション（`prisma migrate deploy`）は引き続き直接接続で実行可能

## 検討した選択肢

### 選択肢1: Prisma Accelerate（採用）

- メリット:
  - コード変更不要
  - すでに `withAccelerate()` が実装済み
  - 無料枠あり
  - コネクションプーリングの恩恵も受けられる
- デメリット:
  - Prisma の外部サービスへの依存が増える
  - 無料枠を超えると有料になる

### 選択肢2: Driver Adapters

- メリット:
  - 外部サービス依存なし
- デメリット:
  - Supabase（PostgreSQL）と Cloudflare Workers に対応したドライバーの選定・設定が複雑
  - スキーマ変更（`previewFeatures = ["driverAdapters"]`）と追加パッケージが必要

## 影響

### ポジティブ

- Edge Runtime での Prisma 利用が可能になり、Cloudflare Workers でのデプロイが実現する
- Prisma Accelerate のコネクションプーリングにより、サーバーレス環境でのコネクション枯渇を防げる

### ネガティブ

- Prisma Accelerate（外部サービス）への依存が加わる
- `DATABASE_URL` の管理が「Supabase の URL」から「Prisma Accelerate の URL」に変わるため、セットアップ手順が増える

## セットアップ手順

```bash
# 1. console.prisma.io でプロジェクト作成 → Accelerate 有効化
#    既存の Supabase DATABASE_URL を接続先として設定し、prisma:// URL を取得

# 2. CF Worker の Secret に設定
wrangler secret put DATABASE_URL
# → prisma://accelerate.prisma.io/?api_key=xxxx を入力

# 3. DIRECT_DATABASE_URL は既存の Supabase URL のまま維持（マイグレーション用）
wrangler secret put DIRECT_DATABASE_URL
# → postgresql://... を入力（変更不要）
```

## 関連

- ADR-0004: Supabase (PostgreSQL) をデータベースに採用
- ADR-0006: ホスティングに Vercel を採用（本 ADR によりバックエンドは Cloudflare Workers に変更）
