# Reflect Forward - リポジトリ構造定義書

## 1. 概要

本プロジェクトは **Turborepo + pnpm** によるモノレポ構成を採用。
フロントエンド、バックエンド、共有パッケージを単一リポジトリで管理する。

---

## 2. ディレクトリ構成

```
reflect-forward/
│
├── .devcontainer/              # DevContainer設定
│   ├── devcontainer.json       # コンテナ設定
│   └── Dockerfile              # 開発環境イメージ
│
├── .github/                    # GitHub関連
│   ├── ISSUE_TEMPLATE/         # Issue テンプレート
│   │   ├── feature.md
│   │   └── bug.md
│   ├── pull_request_template.md
│   └── workflows/
│       └── ci.yml              # CI/CD パイプライン
│
├── .steering/                  # 作業単位のドキュメント
│   └── [YYYYMMDD]-[title]/     # 日付-タイトル形式
│       ├── requirements.md
│       ├── design.md
│       └── tasklist.md
│
├── docs/                       # 永続的ドキュメント
│   ├── product-requirements.md # プロダクト要求定義書
│   ├── functional-design.md    # 機能設計書
│   ├── architecture.md         # 技術仕様書
│   ├── repository-structure.md # リポジトリ構造定義書（本ファイル）
│   ├── development-guidelines.md # 開発ガイドライン
│   └── adr/                    # Architecture Decision Records
│       ├── template.md
│       └── 0001-*.md
│
├── apps/                       # アプリケーション
│   ├── web/                    # フロントエンド（Next.js）
│   └── api/                    # バックエンド（Hono）
│
├── packages/                   # 共有パッケージ
│   └── shared/                 # 共通コード
│
├── .env.example                # 環境変数テンプレート
├── .gitignore
├── .prettierrc
├── CLAUDE.md                   # Claude Code用ガイダンス
├── README.md
├── docker-compose.yml          # ローカル開発用DB
├── package.json                # ルートパッケージ
├── pnpm-lock.yaml
├── pnpm-workspace.yaml         # pnpmワークスペース設定
└── turbo.json                  # Turborepo設定
```

---

## 3. apps/web（フロントエンド）

Next.js 15 App Router を使用したフロントエンドアプリケーション。

```
apps/web/
├── src/
│   ├── app/                    # App Router ページ
│   │   ├── (auth)/             # 認証不要ページ（グループ）
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (protected)/        # 認証必要ページ（グループ）
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── entries/
│   │   │   │   ├── page.tsx           # 一覧
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx       # 新規作成
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── page.tsx       # 詳細
│   │   │   │   │   └── edit/
│   │   │   │   │       └── page.tsx   # 編集
│   │   │   │   └── calendar/
│   │   │   │       └── page.tsx       # カレンダー
│   │   │   └── layout.tsx
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # ランディングページ
│   │   ├── globals.css         # グローバルスタイル
│   │   └── not-found.tsx       # 404ページ
│   │
│   ├── components/             # コンポーネント
│   │   ├── ui/                 # 汎用UIコンポーネント
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Spinner.tsx
│   │   ├── auth/               # 認証関連コンポーネント
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── LogoutButton.tsx
│   │   ├── entries/            # 日記関連コンポーネント
│   │   │   ├── EntryList.tsx
│   │   │   ├── EntryCard.tsx
│   │   │   ├── EntryForm.tsx
│   │   │   ├── EntryDetail.tsx
│   │   │   ├── Calendar.tsx
│   │   │   ├── RatingStars.tsx
│   │   │   └── Pagination.tsx
│   │   └── layout/             # レイアウトコンポーネント
│   │       ├── Header.tsx
│   │       ├── Navigation.tsx
│   │       └── Footer.tsx
│   │
│   ├── contexts/               # React Context
│   │   └── AuthContext.tsx
│   │
│   ├── hooks/                  # カスタムフック
│   │   ├── useAuth.ts
│   │   └── useEntries.ts
│   │
│   └── lib/                    # ユーティリティ
│       ├── api.ts              # APIクライアント
│       └── utils.ts            # 汎用ユーティリティ
│
├── public/                     # 静的ファイル
│   ├── favicon.ico
│   └── images/
│
├── .env.local.example          # 環境変数テンプレート
├── next.config.ts              # Next.js設定
├── tailwind.config.ts          # Tailwind CSS設定
├── tsconfig.json               # TypeScript設定
├── eslint.config.mjs           # ESLint設定
└── package.json
```

### 3.1 ディレクトリの役割

| ディレクトリ          | 役割                                |
| --------------------- | ----------------------------------- |
| `app/`                | ルーティングとページコンポーネント  |
| `app/(auth)/`         | 認証不要ページのグループ            |
| `app/(protected)/`    | 認証必要ページのグループ            |
| `components/ui/`      | 再利用可能な汎用UIコンポーネント    |
| `components/auth/`    | 認証機能に特化したコンポーネント    |
| `components/entries/` | 日記機能に特化したコンポーネント    |
| `components/layout/`  | ページレイアウト用コンポーネント    |
| `contexts/`           | グローバル状態管理（React Context） |
| `hooks/`              | カスタムフック                      |
| `lib/`                | ユーティリティ関数、APIクライアント |

### 3.2 ファイル命名規則

| 種類           | 規則                              | 例                           |
| -------------- | --------------------------------- | ---------------------------- |
| ページ         | `page.tsx`（固定）                | `app/entries/page.tsx`       |
| レイアウト     | `layout.tsx`（固定）              | `app/(protected)/layout.tsx` |
| コンポーネント | PascalCase                        | `EntryCard.tsx`              |
| フック         | camelCase、`use`プレフィックス    | `useAuth.ts`                 |
| ユーティリティ | camelCase                         | `api.ts`, `utils.ts`         |
| Context        | PascalCase、`Context`サフィックス | `AuthContext.tsx`            |

---

## 4. apps/api（バックエンド）

Hono を使用したRESTful APIサーバー。

```
apps/api/
├── prisma/                     # Prisma関連
│   ├── schema.prisma           # データモデル定義
│   └── migrations/             # マイグレーションファイル
│
├── src/
│   ├── index.ts                # エントリーポイント
│   │
│   ├── routes/                 # APIルート
│   │   ├── auth.ts             # 認証ルート（/api/auth/*）
│   │   └── entries.ts          # 日記ルート（/api/entries/*）
│   │
│   ├── middleware/             # ミドルウェア
│   │   └── auth.ts             # 認証ミドルウェア
│   │
│   ├── lib/                    # ユーティリティ
│   │   ├── prisma.ts           # Prisma Clientインスタンス
│   │   ├── jwt.ts              # JWT生成・検証
│   │   └── password.ts         # パスワードハッシュ化
│   │
│   └── types/                  # 型定義
│       └── context.ts          # Hono Context拡張型
│
├── .env.example                # 環境変数テンプレート
├── tsconfig.json               # TypeScript設定
├── eslint.config.mjs           # ESLint設定
└── package.json
```

### 4.1 ディレクトリの役割

| ディレクトリ  | 役割                                      |
| ------------- | ----------------------------------------- |
| `routes/`     | APIエンドポイントの定義                   |
| `middleware/` | リクエスト前後の処理（認証、ログ等）      |
| `lib/`        | ユーティリティ（DB接続、JWT、パスワード） |
| `types/`      | TypeScript型定義                          |

### 4.2 ファイル命名規則

| 種類           | 規則                 | 例                      |
| -------------- | -------------------- | ----------------------- |
| ルート         | リソース名（単数形） | `auth.ts`, `entries.ts` |
| ミドルウェア   | 機能名               | `auth.ts`               |
| ユーティリティ | 機能名               | `jwt.ts`, `prisma.ts`   |
| 型定義         | 用途名               | `context.ts`            |

---

## 5. packages/shared（共有パッケージ）

フロントエンドとバックエンドで共有するコード。

```
packages/shared/
├── src/
│   ├── index.ts                # エクスポートエントリ
│   │
│   ├── types/                  # 型定義
│   │   ├── user.ts             # ユーザー型
│   │   └── entry.ts            # 日記型
│   │
│   ├── validations/            # Zodスキーマ
│   │   ├── auth.ts             # 認証バリデーション
│   │   └── entry.ts            # 日記バリデーション
│   │
│   └── constants/              # 定数
│       └── messages.ts         # エラーメッセージ等
│
├── tsconfig.json
└── package.json
```

### 5.1 ディレクトリの役割

| ディレクトリ   | 役割                       |
| -------------- | -------------------------- |
| `types/`       | 共有型定義（DTOなど）      |
| `validations/` | Zodスキーマ（入力検証）    |
| `constants/`   | 定数（メッセージ、設定値） |

### 5.2 エクスポート規則

すべてのエクスポートは `src/index.ts` を経由する。

```typescript
// packages/shared/src/index.ts
export * from "./types/user";
export * from "./types/entry";
export * from "./validations/auth";
export * from "./validations/entry";
export * from "./constants/messages";
```

### 5.3 インポート方法

```typescript
// apps/web または apps/api から
import { registerSchema, User, ERROR_MESSAGES } from "@reflect-forward/shared";
```

---

## 6. Prisma（データベース）

Prismaによるデータモデル定義とマイグレーション。
**配置場所: `apps/api/prisma/`**（APIサーバーのみがDBにアクセスするため）

```
apps/api/prisma/
├── schema.prisma               # データモデル定義
└── migrations/                 # マイグレーションファイル
    ├── 20260101000000_init/
    │   └── migration.sql
    └── migration_lock.toml
```

### 6.1 Prisma操作コマンド

すべてのコマンドは `apps/api` ディレクトリで実行する。

```bash
cd apps/api
pnpm prisma generate     # クライアント生成
pnpm prisma db push      # スキーマ反映（開発）
pnpm prisma migrate dev  # マイグレーション作成
pnpm prisma studio       # DB管理画面
```

### 6.2 配置場所の選定理由

| 選択肢              | 採用 | 理由                                      |
| ------------------- | ---- | ----------------------------------------- |
| ルートディレクトリ  | ✗    | 複数アプリからの利用想定だが、現状APIのみ |
| **apps/api/prisma** | ✓    | 依存関係が明確、シンプル                  |
| packages/database   | ✗    | 将来の拡張時に検討                        |

---

## 7. docs（ドキュメント）

永続的なプロジェクトドキュメント。

```
docs/
├── product-requirements.md     # プロダクト要求定義書
├── functional-design.md        # 機能設計書
├── architecture.md             # 技術仕様書
├── repository-structure.md     # リポジトリ構造定義書（本ファイル）
├── development-guidelines.md   # 開発ガイドライン
└── adr/                        # Architecture Decision Records
    ├── template.md             # ADRテンプレート
    ├── 0001-use-monorepo-with-turborepo.md
    ├── 0002-choose-hono-for-backend.md
    ├── 0003-jwt-self-implementation.md
    ├── 0004-use-supabase-for-database.md
    └── 0005-use-devcontainer.md
```

### 7.1 ドキュメントの役割

| ファイル                  | 内容                                             |
| ------------------------- | ------------------------------------------------ |
| product-requirements.md   | ビジョン、ターゲット、機能要件、KPI              |
| functional-design.md      | 画面設計、API設計、データモデル、セキュリティ    |
| architecture.md           | 技術スタック、環境変数、デプロイ、パフォーマンス |
| repository-structure.md   | ディレクトリ構成、命名規則、配置ルール           |
| development-guidelines.md | コーディング規約、Git運用、テスト方針            |
| adr/\*.md                 | 技術選定の意思決定記録                           |

---

## 8. .steering（作業ドキュメント）

作業単位の一時的なドキュメント。

```
.steering/
└── [YYYYMMDD]-[開発タイトル]/
    ├── requirements.md         # 今回の要求内容
    ├── design.md               # 変更設計
    └── tasklist.md             # タスクリスト
```

### 8.1 命名規則

```
.steering/20260204-implement-authentication/
.steering/20260210-add-calendar-view/
.steering/20260215-fix-login-bug/
```

---

## 9. 設定ファイル

### 9.1 ルートディレクトリ

| ファイル              | 用途                                            |
| --------------------- | ----------------------------------------------- |
| `turbo.json`          | Turborepo設定（タスク定義、キャッシュ）         |
| `pnpm-workspace.yaml` | pnpmワークスペース定義                          |
| `package.json`        | ルートパッケージ（スクリプト、devDependencies） |
| `docker-compose.yml`  | ローカル開発用PostgreSQL                        |
| `.prettierrc`         | Prettierフォーマット設定                        |
| `.gitignore`          | Git除外設定                                     |

### 9.2 turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {}
  }
}
```

### 9.3 pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

---

## 10. ファイル配置ルール

### 10.1 新規ファイル作成時の判断基準

| 条件                                    | 配置先                             |
| --------------------------------------- | ---------------------------------- |
| フロント/バック両方で使う型             | `packages/shared/src/types/`       |
| フロント/バック両方で使うバリデーション | `packages/shared/src/validations/` |
| フロントのみで使うコンポーネント        | `apps/web/src/components/`         |
| フロントのみで使うフック                | `apps/web/src/hooks/`              |
| APIエンドポイント                       | `apps/api/src/routes/`             |
| DBアクセスロジック                      | `apps/api/src/lib/`                |

### 10.2 コンポーネント配置の判断

| 条件                 | 配置先                |
| -------------------- | --------------------- |
| 複数機能で使う汎用UI | `components/ui/`      |
| 認証機能専用         | `components/auth/`    |
| 日記機能専用         | `components/entries/` |
| ページレイアウト用   | `components/layout/`  |

### 10.3 禁止事項

- `apps/web` から `apps/api` への直接インポート
- `apps/api` から `apps/web` への直接インポート
- `packages/shared` から `apps/*` へのインポート
- ルートディレクトリへのソースコード配置

---

## 11. インポートパス

### 11.1 エイリアス設定

| エイリアス                | パス            | 使用場所 |
| ------------------------- | --------------- | -------- |
| `@/`                      | `./src/`        | apps/web |
| `@reflect-forward/shared` | packages/shared | 全体     |

### 11.2 インポート順序

```typescript
// 1. 外部パッケージ
import { useState } from "react";
import { z } from "zod";

// 2. 内部パッケージ（shared）
import { registerSchema } from "@reflect-forward/shared";

// 3. 内部モジュール（絶対パス）
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";

// 4. 相対パス（同一ディレクトリ内のみ）
import { helper } from "./helper";
```
