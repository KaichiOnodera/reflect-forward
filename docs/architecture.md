# Reflect Forward - 技術仕様書

## 1. テクノロジースタック

### 1.1 概要

| レイヤー       | 技術                 | バージョン |
| -------------- | -------------------- | ---------- |
| フロントエンド | Next.js (App Router) | 15.x       |
| バックエンド   | Hono                 | 4.x        |
| データベース   | PostgreSQL           | 15+        |
| ORM            | Prisma               | 6.x        |
| 言語           | TypeScript           | 5.x        |
| パッケージ管理 | pnpm                 | 9.x        |
| モノレポ管理   | Turborepo            | 2.x        |
| スタイリング   | Tailwind CSS         | 3.x        |
| バリデーション | Zod                  | 3.x        |
| テスト         | Vitest               | 2.x        |

### 1.2 フロントエンド詳細

| ライブラリ      | 用途           | バージョン |
| --------------- | -------------- | ---------- |
| Next.js         | フレームワーク | 15.x       |
| React           | UIライブラリ   | 19.x       |
| Tailwind CSS    | スタイリング   | 3.x        |
| React Hook Form | フォーム管理   | 7.x        |
| Zod             | バリデーション | 3.x        |

**選定理由**

- Next.js: App Routerによるサーバーコンポーネント、SEO対応、Vercelとの親和性
- Tailwind CSS: ユーティリティファーストで高速なスタイリング
- React Hook Form + Zod: 型安全なフォームバリデーション

### 1.3 バックエンド詳細

| ライブラリ        | 用途               | バージョン |
| ----------------- | ------------------ | ---------- |
| Hono              | Webフレームワーク  | 4.x        |
| @hono/node-server | Node.jsアダプター  | 1.x        |
| Prisma            | ORM                | 6.x        |
| jsonwebtoken      | JWT生成・検証      | 9.x        |
| bcryptjs          | パスワードハッシュ | 2.x        |
| Zod               | バリデーション     | 3.x        |

**選定理由**

- Hono: 軽量・高速、TypeScript完全対応、Web標準API準拠
- Prisma: 型安全なデータベースアクセス、マイグレーション管理
- bcryptjs: Pure JavaScript実装（ネイティブ依存なし）

### 1.4 インフラストラクチャ

| サービス       | 用途                       | プラン        |
| -------------- | -------------------------- | ------------- |
| Vercel         | フロントエンドホスティング | Hobby（無料） |
| Vercel         | バックエンドホスティング   | Hobby（無料） |
| Supabase       | PostgreSQLデータベース     | Free          |
| GitHub         | ソースコード管理           | Free          |
| GitHub Actions | CI/CD                      | Free          |

---

## 2. システム構成

### 2.1 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel Edge                             │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │   Next.js Frontend      │  │      Hono API Server        │  │
│  │   (apps/web)            │  │      (apps/api)             │  │
│  │   - Server Components   │  │      - REST API             │  │
│  │   - Client Components   │  │      - JWT Authentication   │  │
│  └─────────────────────────┘  └──────────────┬──────────────┘  │
└──────────────────────────────────────────────┼──────────────────┘
                                               │ Prisma Client
                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase (Tokyo Region)                     │
│                         PostgreSQL 15                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 開発環境構成

```
┌─────────────────────────────────────────────────────────────────┐
│                    DevContainer (Docker)                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Node.js 20 + pnpm 9                                    │   │
│  │  ┌───────────────┐  ┌───────────────┐                   │   │
│  │  │ Next.js       │  │ Hono          │                   │   │
│  │  │ localhost:3000│  │ localhost:3001│                   │   │
│  │  └───────────────┘  └───────────────┘                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┬──┘
                                                               │
┌──────────────────────────────────────────────────────────────┴──┐
│                    Docker Compose                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 15                                          │   │
│  │  localhost:5432                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 開発環境

### 3.1 必須ツール

| ツール  | バージョン | 用途           |
| ------- | ---------- | -------------- |
| Node.js | 20.x LTS   | ランタイム     |
| pnpm    | 9.x        | パッケージ管理 |
| Docker  | 24.x+      | コンテナ実行   |
| Git     | 2.x        | バージョン管理 |

### 3.2 推奨エディタ

| エディタ | 拡張機能                                            |
| -------- | --------------------------------------------------- |
| VS Code  | ESLint, Prettier, Tailwind CSS IntelliSense, Prisma |

### 3.3 DevContainer

開発環境の統一のためDevContainerを使用。

**含まれる設定**

- Node.js 20
- pnpm 9
- Git
- VS Code拡張機能（自動インストール）
- PostgreSQL CLIツール

**起動方法**

```bash
# VS Codeで開く
code .
# コマンドパレット → "Dev Containers: Reopen in Container"
```

---

## 4. 環境変数

### 4.1 バックエンド（apps/api/.env）

| 変数名              | 説明                         | 例                                                      | 必須                |
| ------------------- | ---------------------------- | ------------------------------------------------------- | ------------------- |
| DATABASE_URL        | PostgreSQL接続文字列         | `postgresql://user:pass@localhost:5432/reflect_forward` | Yes                 |
| JWT_SECRET          | JWT署名キー（32文字以上）    | `your-super-secret-key-min-32-chars`                    | Yes                 |
| JWT_ACCESS_EXPIRES  | アクセストークン有効期限     | `15m`                                                   | Yes                 |
| JWT_REFRESH_EXPIRES | リフレッシュトークン有効期限 | `7d`                                                    | Yes                 |
| PORT                | APIサーバーポート            | `3001`                                                  | No（default: 3001） |
| CORS_ORIGIN         | 許可するオリジン             | `http://localhost:3000`                                 | Yes                 |
| NODE_ENV            | 実行環境                     | `development` / `production`                            | No                  |

### 4.2 フロントエンド（apps/web/.env.local）

| 変数名              | 説明           | 例                      | 必須 |
| ------------------- | -------------- | ----------------------- | ---- |
| NEXT_PUBLIC_API_URL | APIサーバーURL | `http://localhost:3001` | Yes  |

### 4.3 環境別設定

| 環境 | DATABASE_URL       | CORS_ORIGIN                    | Cookie Secure |
| ---- | ------------------ | ------------------------------ | ------------- |
| 開発 | localhost:5432     | http://localhost:3000          | false         |
| 本番 | Supabase接続文字列 | https://your-domain.vercel.app | true          |

---

## 5. デプロイ構成

### 5.1 Vercelデプロイ設定

**フロントエンド（apps/web）**

```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install"
}
```

**バックエンド（apps/api）**

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install"
}
```

### 5.2 デプロイフロー

```
GitHub Push (main)
       │
       ▼
┌──────────────────┐
│  GitHub Actions  │
│  - Lint          │
│  - Type Check    │
│  - Test          │
└────────┬─────────┘
         │ Success
         ▼
┌──────────────────┐
│  Vercel Build    │
│  - Frontend      │
│  - Backend       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Vercel Deploy   │
│  - Preview (PR)  │
│  - Production    │
└──────────────────┘
```

### 5.3 ブランチ戦略

| ブランチ   | 用途         | デプロイ先 |
| ---------- | ------------ | ---------- |
| main       | 本番リリース | Production |
| feature/\* | 機能開発     | Preview    |
| fix/\*     | バグ修正     | Preview    |

---

## 6. パフォーマンス要件

### 6.1 レスポンスタイム

| エンドポイント            | 目標（p95） | 備考           |
| ------------------------- | ----------- | -------------- |
| GET /api/auth/me          | 100ms       | キャッシュなし |
| POST /api/auth/login      | 300ms       | bcrypt比較含む |
| GET /api/entries          | 200ms       | 20件取得時     |
| POST /api/entries         | 150ms       | 単一作成       |
| GET /api/entries/calendar | 200ms       | 1ヶ月分        |

### 6.2 フロントエンドパフォーマンス

| 指標                           | 目標    | 測定方法   |
| ------------------------------ | ------- | ---------- |
| LCP (Largest Contentful Paint) | < 2.5s  | Lighthouse |
| FID (First Input Delay)        | < 100ms | Lighthouse |
| CLS (Cumulative Layout Shift)  | < 0.1   | Lighthouse |
| TTI (Time to Interactive)      | < 3s    | Lighthouse |

### 6.3 データベース

| 指標                   | 目標                            |
| ---------------------- | ------------------------------- |
| 接続プール             | 最大10接続（Supabase Free制限） |
| クエリタイムアウト     | 5秒                             |
| 最大レコード数（想定） | 100,000エントリ/ユーザー        |

---

## 7. セキュリティ要件

### 7.1 通信

| 項目          | 要件                   |
| ------------- | ---------------------- |
| プロトコル    | HTTPS必須（本番環境）  |
| TLSバージョン | 1.2以上                |
| HSTS          | 有効（Vercel自動設定） |

### 7.2 認証・認可

| 項目                 | 実装                       |
| -------------------- | -------------------------- |
| パスワード保存       | bcrypt（コスト10）         |
| アクセストークン     | JWT（HS256、15分有効）     |
| リフレッシュトークン | UUID v4（7日有効、DB保存） |
| セッション管理       | HttpOnly Cookie + メモリ   |

### 7.3 入力検証

| レイヤー       | 実装                  |
| -------------- | --------------------- |
| フロントエンド | Zod + React Hook Form |
| バックエンド   | Zod（shared package） |
| データベース   | Prisma型制約          |

### 7.4 その他

| 項目                | 実装                     |
| ------------------- | ------------------------ |
| CORS                | 許可オリジン明示指定     |
| CSP                 | Next.js設定で有効化      |
| SQLインジェクション | Prismaパラメータ化クエリ |
| XSS                 | React自動エスケープ      |

---

## 8. 監視・ログ

### 8.1 ログ出力

| 種類                 | 出力先            | 内容                   |
| -------------------- | ----------------- | ---------------------- |
| アクセスログ         | Vercel Logs       | リクエスト/レスポンス  |
| エラーログ           | Vercel Logs       | 例外、スタックトレース |
| アプリケーションログ | console.log/error | 業務ログ               |

### 8.2 ログフォーマット（バックエンド）

```
[2026-02-04T12:00:00.000Z] INFO: POST /api/auth/login 200 150ms
[2026-02-04T12:00:01.000Z] ERROR: POST /api/auth/login 401 - Invalid credentials
```

### 8.3 監視（MVP後）

| サービス         | 用途               |
| ---------------- | ------------------ |
| Vercel Analytics | パフォーマンス監視 |
| Sentry           | エラートラッキング |

---

## 9. 技術的制約

### 9.1 Vercel Hobby プラン制限

| 項目                     | 制限        |
| ------------------------ | ----------- |
| サーバーレス関数実行時間 | 10秒        |
| サーバーレス関数メモリ   | 1024MB      |
| 帯域幅                   | 100GB/月    |
| ビルド時間               | 45分/ビルド |

### 9.2 Supabase Free プラン制限

| 項目               | 制限   |
| ------------------ | ------ |
| データベースサイズ | 500MB  |
| 帯域幅             | 2GB/月 |
| 同時接続           | 最大60 |
| 直接接続           | 最大10 |

### 9.3 対応ブラウザ

| ブラウザ | バージョン      |
| -------- | --------------- |
| Chrome   | 最新2バージョン |
| Firefox  | 最新2バージョン |
| Safari   | 最新2バージョン |
| Edge     | 最新2バージョン |

---

## 10. 技術選定の詳細（ADR）

各技術の選定理由は ADR (Architecture Decision Records) を参照:

| ADR                                                   | タイトル              |
| ----------------------------------------------------- | --------------------- |
| [ADR-0001](./adr/0001-use-monorepo-with-turborepo.md) | モノレポ (Turborepo)  |
| [ADR-0002](./adr/0002-choose-hono-for-backend.md)     | Hono                  |
| [ADR-0003](./adr/0003-jwt-self-implementation.md)     | JWT 自前実装          |
| [ADR-0004](./adr/0004-use-supabase-for-database.md)   | Supabase (PostgreSQL) |
| [ADR-0005](./adr/0005-use-devcontainer.md)            | DevContainer          |

---

## 11. 依存関係管理

### 11.1 パッケージ更新方針

| 種類                 | 更新頻度 | 方法             |
| -------------------- | -------- | ---------------- |
| セキュリティパッチ   | 即時     | Dependabot自動PR |
| マイナーアップデート | 月1回    | 手動確認・更新   |
| メジャーアップデート | 四半期   | 影響評価後に更新 |

### 11.2 バージョン固定

```json
// package.json
{
  "dependencies": {
    "hono": "^4.0.0", // キャレット: マイナー更新許可
    "prisma": "~6.0.0" // チルダ: パッチ更新のみ許可
  }
}
```

### 11.3 pnpm-lock.yaml

- コミット必須
- CI/CDでは `pnpm install --frozen-lockfile` を使用
