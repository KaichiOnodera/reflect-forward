# CLAUDE.md

このファイルは Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Reflect Forward は「振り返って前進する」をコンセプトにした日記サービス。
メモ・評価・振り返りを記録し、将来の AI 分析で自己理解を支援する。

## 現在の進捗

- [x] **Phase 0**: プロジェクト基盤（モノレポ、CI/CD、DevContainer）
- [ ] **Phase 1**: 認証機能（JWT、ログイン/登録）
- [ ] **Phase 2**: 日記CRUD機能
- [ ] **Phase 3**: UI/UX改善
- [ ] **Phase 4**: AI分析機能

## 技術スタック

- **モノレポ**: Turborepo + pnpm (v9.15.0)
- **フロントエンド**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **バックエンド**: Hono（軽量・TypeScript ファースト）
- **認証**: JWT 自前実装（Supabase Auth は使用しない）
- **DB**: Supabase PostgreSQL（本番）/ Docker PostgreSQL（ローカル）
- **ORM**: Prisma
- **バリデーション**: Zod（フロント・バックで共有）
- **テスト**: Vitest
- **CI/CD**: GitHub Actions + CodeRabbit（AIレビュー）

## コマンド

```bash
# 開発
pnpm dev              # 全アプリ起動
pnpm dev --filter web # フロントのみ
pnpm dev --filter api # バックエンドのみ

# ビルド・テスト
pnpm build
pnpm test
pnpm lint

# データベース（apps/api ディレクトリで実行）
cd apps/api
pnpm prisma generate              # Prisma クライアント生成
pnpm prisma db push               # スキーマを DB に反映
pnpm prisma migrate dev           # マイグレーション実行
pnpm prisma studio                # DB 管理画面起動

# または、ルートからスキーマパスを指定
pnpm --filter @reflect-forward/api exec prisma generate --schema=../../prisma/schema.prisma

# Docker（ローカル DB）
docker-compose up -d  # PostgreSQL 起動
docker-compose down   # PostgreSQL 停止
```

## DevContainer での開発

1. VS Code で「Reopen in Container」を選択
2. コンテナ起動後、依存関係をインストール:
   ```bash
   pnpm install
   ```
3. PostgreSQL を起動:
   ```bash
   docker-compose up -d
   ```
4. 環境変数を設定:
   ```bash
   cp .env.example .env
   ```
5. Prisma クライアントを生成:
   ```bash
   cd apps/api && pnpm prisma generate
   ```
6. 開発サーバーを起動:
   ```bash
   pnpm dev
   ```

## アーキテクチャ

```
apps/
  web/           → Next.js 15 フロントエンド（REST API 経由で通信）
  api/           → Hono バックエンド（JWT 認証、Prisma ORM）
packages/
  shared/        → 共通の型定義・Zod スキーマ
prisma/
  schema.prisma  → データベーススキーマ（User, DiaryEntry, RefreshToken）
docs/
  ARCHITECTURE.md → 詳細なアーキテクチャ設計
  adr/           → 技術選定の理由（ADR）
```

### 重要なファイル

- `prisma/schema.prisma` - DBスキーマ定義
- `packages/shared/src/validations/` - Zodバリデーションスキーマ
- `packages/shared/src/types/` - 共有型定義
- `.env.example` - 環境変数テンプレート

## 開発ワークフロー

- **ブランチ命名**: `feature/issue-{番号}-{概要}` または `fix/issue-{番号}-{概要}`
- **コミット**: Conventional Commits を使用（`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`）
- **マージ**: PR 経由でのみ、CI 通過必須

## 環境変数

`.env.example` をコピーして `.env` を作成:

```bash
cp .env.example .env
```

詳細は `.env.example` を参照。
