# Phase 1 認証機能 - 設計

## アーキテクチャ選定

**採用: サービス層 + リポジトリパターン**

```
routes/          # HTTPリクエスト/レスポンス処理
    ↓
services/        # ビジネスロジック
    ↓
repositories/    # データアクセス抽象化
    ↓
lib/prisma.ts    # 実際のDB操作
```

**選定理由:**

- 責任が明確に分離される
- サービス層のテストでリポジトリをモックできる
- メガベンチャーでも広く採用されている実用的なパターン
- クリーンアーキテクチャほど複雑でなく、学習と実装のバランスが良い

## API側の変更

### ディレクトリ構造

```
apps/api/src/
├── index.ts                    # エントリーポイント
├── routes/
│   └── auth.ts                 # 認証ルート（入出力処理）
├── services/
│   └── authService.ts          # 認証ビジネスロジック
├── repositories/
│   ├── userRepository.ts       # ユーザーデータアクセス
│   └── refreshTokenRepository.ts
├── middleware/
│   └── auth.ts                 # 認証ミドルウェア
├── lib/
│   ├── prisma.ts               # Prisma Clientシングルトン
│   ├── password.ts             # bcryptラッパー
│   └── jwt.ts                  # JWT生成・検証
└── types/
    └── context.ts              # Hono Context型定義
```

### 各層の責任

| 層           | ファイル                    | 責任                                                          |
| ------------ | --------------------------- | ------------------------------------------------------------- |
| routes       | `auth.ts`                   | HTTPリクエストのパース、バリデーション、レスポンス生成        |
| services     | `authService.ts`            | ビジネスロジック（重複チェック→ハッシュ化→保存→トークン発行） |
| repositories | `userRepository.ts`         | `findByEmail()`, `create()`, `findById()`                     |
| repositories | `refreshTokenRepository.ts` | `create()`, `findByToken()`, `delete()`                       |

### APIエンドポイント

| Method | Path                 | 処理                        |
| ------ | -------------------- | --------------------------- |
| POST   | `/api/auth/register` | ユーザー登録 + トークン発行 |
| POST   | `/api/auth/login`    | ログイン + トークン発行     |
| POST   | `/api/auth/refresh`  | トークンリフレッシュ        |
| POST   | `/api/auth/logout`   | ログアウト（トークン削除）  |
| GET    | `/api/auth/me`       | 現在のユーザー情報取得      |

### 追加依存関係

- `uuid` - リフレッシュトークン生成用

## Web側の変更

### ディレクトリ構造

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (protected)/
│   │   ├── dashboard/page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx              # AuthProvider追加
│   └── page.tsx                # ランディング更新
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   └── Spinner.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       ├── RegisterForm.tsx
│       └── LogoutButton.tsx
├── contexts/
│   └── AuthContext.tsx
└── lib/
    └── api.ts
```

## 変更ファイル（shared）

| ファイル                       | 変更内容                                |
| ------------------------------ | --------------------------------------- |
| `packages/shared/src/index.ts` | import拡張子を.jsに修正（NodeNext対応） |

## 影響範囲

- 新規ファイル追加のみ、既存機能への影響なし
- `docs/repository-structure.md` に `services/`, `repositories/` を追記（アーキテクチャ変更のため）
