# アーキテクチャ概要

## システム構成

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
│                    (Browser / Mobile)                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Frontend)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Next.js 14                         │  │
│  │  - App Router (Server Components)                     │  │
│  │  - Tailwind CSS + shadcn/ui                          │  │
│  │  - TypeScript                                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (API Server)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                      Hono                             │  │
│  │  - JWT Authentication                                 │  │
│  │  - OpenAPI/Swagger                                    │  │
│  │  - Prisma ORM                                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase (PostgreSQL)                     │
│  - Users                                                    │
│  - Diary Entries                                            │
│  - Refresh Tokens                                           │
└─────────────────────────────────────────────────────────────┘
```

## ディレクトリ構成

```
reflect-forward/
│
├── .devcontainer/              # 開発環境コンテナ設定
│   ├── devcontainer.json
│   └── Dockerfile
│
├── .github/                    # GitHub 関連
│   ├── ISSUE_TEMPLATE/
│   │   ├── feature.md
│   │   └── bug.md
│   ├── pull_request_template.md
│   └── workflows/
│       └── ci.yml
│
├── docs/                       # ドキュメント
│   ├── ARCHITECTURE.md         # このファイル
│   └── adr/                    # Architecture Decision Records
│       ├── template.md
│       ├── 0001-use-monorepo-with-turborepo.md
│       ├── 0002-choose-hono-for-backend.md
│       ├── 0003-jwt-self-implementation.md
│       ├── 0004-use-supabase-for-database.md
│       └── 0005-use-devcontainer.md
│
├── apps/
│   ├── web/                    # フロントエンド (Next.js)
│   │   ├── src/
│   │   │   ├── app/            # App Router ページ
│   │   │   ├── components/     # UI コンポーネント
│   │   │   ├── hooks/          # カスタムフック
│   │   │   ├── lib/            # ユーティリティ
│   │   │   └── stores/         # 状態管理
│   │   ├── public/
│   │   └── package.json
│   │
│   └── api/                    # バックエンド (Hono)
│       ├── src/
│       │   ├── index.ts        # エントリーポイント
│       │   ├── routes/         # API ルート
│       │   ├── middleware/     # ミドルウェア
│       │   ├── services/       # ビジネスロジック
│       │   └── lib/            # ユーティリティ
│       ├── Dockerfile          # 本番用
│       └── package.json
│
├── packages/
│   └── shared/                 # 共通コード
│       ├── src/
│       │   ├── types/          # 型定義
│       │   └── validations/    # Zod スキーマ
│       └── package.json
│
├── prisma/
│   ├── schema.prisma           # データモデル定義
│   └── migrations/             # マイグレーションファイル
│
├── docker-compose.yml          # ローカル開発用 DB
├── turbo.json                  # Turborepo 設定
├── pnpm-workspace.yaml         # pnpm ワークスペース
├── CLAUDE.md                   # Claude Code 用
└── README.md
```

## データモデル

```
┌─────────────────────┐
│       users         │
├─────────────────────┤
│ id (PK)             │
│ email               │
│ password_hash       │
│ display_name        │
│ avatar_url          │
│ created_at          │
│ updated_at          │
└──────────┬──────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐       ┌─────────────────────┐
│   diary_entries     │       │   refresh_tokens    │
├─────────────────────┤       ├─────────────────────┤
│ id (PK)             │       │ id (PK)             │
│ user_id (FK)        │       │ user_id (FK)        │
│ content             │       │ token               │
│ short_memo          │       │ expires_at          │
│ rating              │       │ created_at          │
│ entry_date          │       └─────────────────────┘
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

## 認証フロー

```
┌────────┐          ┌────────┐          ┌────────┐
│ Client │          │  API   │          │   DB   │
└───┬────┘          └───┬────┘          └───┬────┘
    │                   │                   │
    │ POST /auth/login  │                   │
    │ {email, password} │                   │
    │──────────────────>│                   │
    │                   │ SELECT user       │
    │                   │──────────────────>│
    │                   │<──────────────────│
    │                   │                   │
    │                   │ Verify password   │
    │                   │ (bcrypt.compare)  │
    │                   │                   │
    │                   │ Generate JWT      │
    │                   │ Generate Refresh  │
    │                   │                   │
    │                   │ INSERT refresh    │
    │                   │──────────────────>│
    │                   │<──────────────────│
    │                   │                   │
    │ {accessToken,     │                   │
    │  refreshToken}    │                   │
    │<──────────────────│                   │
    │                   │                   │
    │ GET /entries      │                   │
    │ Authorization:    │                   │
    │ Bearer {token}    │                   │
    │──────────────────>│                   │
    │                   │ Verify JWT        │
    │                   │                   │
    │                   │ SELECT entries    │
    │                   │──────────────────>│
    │                   │<──────────────────│
    │                   │                   │
    │ {entries: [...]}  │                   │
    │<──────────────────│                   │
```

## API エンドポイント

### 認証 (`/api/auth`)

| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| POST | `/register` | ユーザー登録 | 不要 |
| POST | `/login` | ログイン | 不要 |
| POST | `/refresh` | トークン更新 | Refresh Token |
| POST | `/logout` | ログアウト | 必要 |
| GET | `/me` | 現在のユーザー | 必要 |

### 日記 (`/api/entries`)

| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/` | 一覧取得 | 必要 |
| POST | `/` | 作成 | 必要 |
| GET | `/:id` | 詳細取得 | 必要 |
| PUT | `/:id` | 更新 | 必要 |
| DELETE | `/:id` | 削除 | 必要 |
| GET | `/calendar` | カレンダー用 | 必要 |

## 技術選定の詳細

各技術の選定理由は ADR (Architecture Decision Records) を参照:

- [ADR-0001: モノレポ (Turborepo)](./adr/0001-use-monorepo-with-turborepo.md)
- [ADR-0002: Hono](./adr/0002-choose-hono-for-backend.md)
- [ADR-0003: JWT 自前実装](./adr/0003-jwt-self-implementation.md)
- [ADR-0004: Supabase (PostgreSQL)](./adr/0004-use-supabase-for-database.md)
- [ADR-0005: devContainer](./adr/0005-use-devcontainer.md)
