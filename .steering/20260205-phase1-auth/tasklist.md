# Phase 1 認証機能 - タスクリスト

## PR戦略

### PR分割

| PR      | 内容                                                                  | ブランチ                   |
| ------- | --------------------------------------------------------------------- | -------------------------- |
| **PR1** | API認証基盤（lib, repositories, services, tests, routes, middleware） | `feature/phase-1-auth-api` |
| **PR2** | Web認証機能（UIコンポーネント, APIクライアント, AuthContext, ページ） | `feature/phase-1-auth-web` |

### ブランチ戦略

```
main
  └── feature/phase-1-auth（最終マージ先）
        ├── feature/phase-1-auth-api   ← PR1
        └── feature/phase-1-auth-web   ← PR2（PR1マージ後に作成）
```

### 作業手順

1. `feature/phase-1-auth` から `feature/phase-1-auth-api` を作成
2. Phase 1-A〜D を実装
3. PR1を作成（`feature/phase-1-auth-api` → `feature/phase-1-auth`）
4. PR1マージ後、`feature/phase-1-auth` から `feature/phase-1-auth-web` を作成
5. Phase 1-E〜H を実装
6. PR2を作成（`feature/phase-1-auth-web` → `feature/phase-1-auth`）
7. 最終的に `feature/phase-1-auth` → `main` へPR

---

## 実装タスク

### Phase 1-A: API基盤（lib層） ✅

- [x] `uuid` 依存関係を追加
- [x] `src/lib/prisma.ts` - Prisma Clientシングルトン作成
- [x] `src/lib/password.ts` - bcryptラッパー（hash, verify）作成
- [x] `src/lib/jwt.ts` - JWT生成・検証、リフレッシュトークン生成作成
- [x] `src/types/context.ts` - Hono Context型定義作成

### Phase 1-B: APIリポジトリ層 ✅

- [x] `src/repositories/userRepository.ts` - ユーザーリポジトリ作成
  - `findByEmail(email: string)`
  - `findById(id: string)`
  - `create(data: CreateUserData)`
- [x] `src/repositories/refreshTokenRepository.ts` - リフレッシュトークンリポジトリ作成
  - `create(data: CreateRefreshTokenData)`
  - `findByToken(token: string)`
  - `deleteByToken(token: string)`
  - `deleteByUserId(userId: string)`

### Phase 1-C: APIサービス層 ✅

- [x] `src/services/authService.ts` - 認証サービス作成
  - `register(input: RegisterInput)` - 登録ロジック
  - `login(input: LoginInput)` - ログインロジック
  - `refresh(token: string)` - トークンリフレッシュロジック
  - `logout(token: string)` - ログアウトロジック
  - `getCurrentUser(userId: string)` - ユーザー取得ロジック

### Phase 1-C': APIサービス層テスト ✅

- [x] `src/services/__tests__/authService.test.ts` - 認証サービスユニットテスト
  - register: 正常系、メール重複エラー
  - login: 正常系、認証エラー
  - refresh: 正常系、トークン無効エラー

### Phase 1-D: APIルート・ミドルウェア ✅

- [x] `src/middleware/auth.ts` - 認証ミドルウェア作成
- [x] `src/routes/auth.ts` - 認証ルート作成（サービス層を呼び出す）
- [x] `src/index.ts` - authルートをマウント

**PR #16 作成済み - CIの結果待ち**

### Phase 1-E: Web UIコンポーネント

- [ ] `src/components/ui/Button.tsx`
- [ ] `src/components/ui/Input.tsx`
- [ ] `src/components/ui/Card.tsx`
- [ ] `src/components/ui/Spinner.tsx`

### Phase 1-F: Web認証機能

- [ ] `src/lib/api.ts` - APIクライアント作成
- [ ] `src/contexts/AuthContext.tsx` - 認証コンテキスト作成
- [ ] `src/components/auth/LoginForm.tsx`
- [ ] `src/components/auth/RegisterForm.tsx`
- [ ] `src/components/auth/LogoutButton.tsx`

### Phase 1-G: Webページ

- [ ] `src/app/(auth)/layout.tsx` - 認証不要ページレイアウト
- [ ] `src/app/(auth)/login/page.tsx`
- [ ] `src/app/(auth)/register/page.tsx`
- [ ] `src/app/(protected)/layout.tsx` - 認証必要ページレイアウト
- [ ] `src/app/(protected)/dashboard/page.tsx`
- [ ] `src/app/layout.tsx` - AuthProvider追加
- [ ] `src/app/page.tsx` - ランディングページ更新

### Phase 1-H: 修正・検証

- [ ] `packages/shared/src/index.ts` - import拡張子修正
- [ ] `docs/repository-structure.md` - services/, repositories/追記
- [ ] `pnpm lint` 通過確認
- [ ] `pnpm build` 通過確認
- [ ] `pnpm format` 実行
- [ ] 手動テスト（登録→ログイン→ダッシュボード→ログアウト）

## 実装順序

1. API基盤（lib層）
2. APIリポジトリ層
3. APIサービス層
4. **APIサービス層テスト** ← 実装後にテスト追加
5. APIルート・ミドルウェア
6. Web UIコンポーネント
7. Web認証機能
8. Webページ
9. 修正・検証

## テスト戦略

- **Phase 1**: サービス層の実装後にユニットテストを追加（後付けテスト）
- **Phase 2以降**: TDDに挑戦（テストを先に書いてから実装）
