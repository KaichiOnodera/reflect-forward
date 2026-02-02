# CLAUDE.md

このファイルは Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Reflect Forward は「振り返って前進する」をコンセプトにした日記サービス。
メモ・評価・振り返りを記録し、将来の AI 分析で自己理解を支援する。

## 技術スタック

- **モノレポ**: Turborepo + pnpm
- **フロントエンド**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **バックエンド**: Hono（軽量・TypeScript ファースト）
- **認証**: JWT 自前実装（Supabase Auth は使用しない）
- **DB**: Supabase PostgreSQL（本番）/ Docker PostgreSQL（ローカル）
- **ORM**: Prisma
- **バリデーション**: Zod（フロント・バックで共有）
- **テスト**: Vitest
- **CI/CD**: GitHub Actions

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

# データベース
pnpm prisma generate  # Prisma クライアント生成
pnpm prisma db push   # スキーマを DB に反映
pnpm prisma migrate dev # マイグレーション実行
pnpm prisma studio    # DB 管理画面起動

# Docker（ローカル DB）
docker-compose up -d  # PostgreSQL 起動
docker-compose down   # PostgreSQL 停止
```

## アーキテクチャ

```
apps/web/        → Next.js フロントエンド（REST API 経由で通信）
apps/api/        → Hono バックエンド（JWT 認証、Prisma ORM）
packages/shared/ → 共通の型定義・Zod スキーマ
prisma/          → データベーススキーマ・マイグレーション
```

技術選定の理由は `docs/adr/` を参照。

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
