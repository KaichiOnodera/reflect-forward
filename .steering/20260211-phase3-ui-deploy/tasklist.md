# Phase 3: UI/UX 改善 + デプロイ準備 — タスクリスト

## ブランチ戦略

PR の粒度を小さくするため、機能単位でブランチを切り `main` にマージする。
Phase 2 PR (#28) は `main` にマージ済み。各ブランチは `main` から作成する。

| PR  | ブランチ             | 内容                  | 依存         |
| --- | -------------------- | --------------------- | ------------ |
| PR1 | `feat/template-api`  | 3-A shared + 3-B API  | なし         |
| PR2 | `feat/template-web`  | 3-C Web               | PR1 マージ後 |
| PR3 | `feat/header-footer` | 3-D ヘッダー/フッター | なし         |
| PR4 | `feat/responsive`    | 3-E レスポンシブ      | なし         |
| PR5 | `feat/deploy-prep`   | 3-F デプロイ準備      | なし         |

PR3〜5 は互いに独立しており、PR1 と並行して進められる。

---

## Phase 3-A: shared — テンプレート型・バリデーション追加

- [ ] `packages/shared/src/types/template.ts` を作成
  - `DiaryTemplate` 型: id, userId, name, content, isDefault, createdAt, updatedAt
- [ ] `packages/shared/src/validations/template.ts` を作成
  - `createTemplateSchema`: name（必須、最大50文字）, content（必須、最大10000文字）
  - `updateTemplateSchema`: name, content（いずれも optional、1つ以上必須）
  - `templateIdParamSchema`: id（UUID）
  - 型エクスポート: `CreateTemplateInput`, `UpdateTemplateInput`, `TemplateIdParam`
- [ ] `packages/shared/src/index.ts` に re-export を追加

**コミット:** `feat(shared): テンプレート用の型・バリデーションスキーマを追加`

> ※ このコミットは `feat/template-api` ブランチに含める

---

## Phase 3-B: API — テンプレート CRUD

### 3-B-1: Prisma スキーマ

- [ ] `apps/api/prisma/schema.prisma` に `DiaryTemplate` モデルを追加
  - id, userId, name, content, isDefault, createdAt, updatedAt
  - User との 1:N リレーション
  - `@@map("diary_templates")`, `@@index([userId])`
- [ ] User モデルに `templates DiaryTemplate[]` を追加
- [ ] `pnpm prisma generate` でクライアント再生成
- [ ] `pnpm prisma db push` でローカル DB に反映

### 3-B-2: Repository

- [ ] `apps/api/src/repositories/templateRepository.ts` を作成
  - `findByUserId(userId)` — createdAt 降順
  - `findById(id)`
  - `findDefault(userId)` — `isDefault: true`
  - `create(data)` — userId, name, content
  - `update(id, data)` — name, content（部分更新）
  - `delete(id)`
  - `setDefault(userId, templateId)` — `$transaction` で排他的デフォルト

### 3-B-3: Service

- [ ] `apps/api/src/services/templateService.ts` を作成
  - `TemplateError` クラス（code: "NOT_FOUND"）
  - `formatTemplate` ヘルパー（Date → ISO 文字列変換）
  - `list(userId)` — テンプレート一覧
  - `getById(userId, templateId)` — 所有権チェック付き
  - `getDefault(userId)` — デフォルトテンプレート取得
  - `create(userId, input)` — 作成
  - `update(userId, templateId, input)` — 所有権チェック付き更新
  - `delete(userId, templateId)` — 所有権チェック付き削除
  - `setDefault(userId, templateId)` — 所有権チェック付きデフォルト設定

### 3-B-4: Route

- [ ] `apps/api/src/routes/templates.ts` を作成
  - `GET /` — 一覧
  - `POST /` — 作成（201）
  - `GET /default` — デフォルト取得（`:id` より先に定義）
  - `GET /:id` — 詳細
  - `PUT /:id` — 更新
  - `DELETE /:id` — 削除
  - `PUT /:id/default` — デフォルト設定
- [ ] `apps/api/src/index.ts` に `app.route("/api/templates", templatesRoutes)` を追加

### 3-B-5: テスト

- [ ] `apps/api/src/services/__tests__/templateService.test.ts` を作成
  - list / getById / getDefault / create / update / delete / setDefault
  - 所有権チェック（他ユーザーで TemplateError）
  - 存在しないテンプレートで TemplateError

**コミット:** `feat(api): テンプレートCRUD APIを実装`

> ※ このコミットは `feat/template-api` ブランチに含める → PR1 作成

---

## Phase 3-C: Web — テンプレート機能

### 3-C-1: API クライアント拡張

- [ ] `apps/web/src/lib/api.ts` に追加
  - `TemplateResponse` 型
  - `getTemplates()`, `getTemplate(id)`, `getDefaultTemplate()`
  - `createTemplate(data)`, `updateTemplate(id, data)`, `deleteTemplate(id)`
  - `setDefaultTemplate(id)`

### 3-C-2: テンプレートコンポーネント

- [ ] `apps/web/src/components/templates/TemplateForm.tsx` を作成
  - mode: create/edit、name + content フィールド
  - useState + Zod safeParse パターン（EntryForm と同じ）
- [ ] `apps/web/src/components/templates/TemplateCard.tsx` を作成
  - Card ベース、名前 + デフォルトバッジ + content プレビュー
  - 編集リンク + デフォルト設定ボタン + 削除ボタン

### 3-C-3: テンプレートページ

- [ ] `apps/web/src/app/(protected)/templates/page.tsx` を作成
  - テンプレート一覧（TemplateCard）+ 新規作成ボタン
  - デフォルト設定・削除時にリスト再取得
- [ ] `apps/web/src/app/(protected)/templates/new/page.tsx` を作成
  - TemplateForm (create) → 保存後 `/templates` に遷移
- [ ] `apps/web/src/app/(protected)/templates/[id]/edit/page.tsx` を作成
  - テンプレート読み込み → TemplateForm (edit) → 更新後 `/templates` に遷移

### 3-C-4: 日記作成へのテンプレート自動適用

- [ ] `apps/web/src/components/entries/EntryForm.tsx` に `defaultContent` prop を追加
  - content の初期値: `initialData?.content ?? defaultContent ?? ""`
- [ ] `apps/web/src/app/(protected)/entries/new/page.tsx` を修正
  - `useEffect` で `api.getDefaultTemplate()` を呼び出し（エラーは無視）
  - 取得した content を `EntryForm` の `defaultContent` に渡す

**コミット:** `feat(web): テンプレート管理機能を実装`

> ※ このコミットは `feat/template-web` ブランチに含める → PR2 作成（PR1 マージ後）

---

## Phase 3-D: ヘッダー/フッター

- [ ] `apps/web/src/components/layout/Header.tsx` を作成
  - アプリ名（→ `/dashboard`）
  - ナビ: ダッシュボード / 日記一覧 / カレンダー / テンプレート
  - 現在パスでアクティブリンクハイライト（`usePathname`）
  - ユーザー表示名 + ログアウトボタン
  - モバイル: ハンバーガーメニュー（useState で開閉）
- [ ] `apps/web/src/components/layout/Footer.tsx` を作成
  - `© 2026 Reflect Forward`
- [ ] `apps/web/src/app/(protected)/layout.tsx` を修正
  - インラインヘッダーを `<Header />` に置換
  - `<Footer />` を追加
  - `flex min-h-screen flex-col` + `flex-1` でフッター下部固定

**コミット:** `feat(web): ヘッダー・フッターを実装`

> ※ このコミットは `feat/header-footer` ブランチに含める → PR3 作成

---

## Phase 3-E: レスポンシブデザイン

- [ ] `apps/web/src/app/page.tsx` — ランディングページ
  - `p-24` → `p-6 md:p-24`
  - `text-4xl` → `text-2xl md:text-4xl`
  - ボタン群: `flex gap-4` → `flex flex-col sm:flex-row gap-4`
- [ ] `apps/web/src/components/ui/Card.tsx`
  - `p-8` → `p-4 md:p-8`
- [ ] `apps/web/src/components/entries/Calendar.tsx`
  - セル高さ: `h-14` → `h-10 sm:h-14`
- [ ] `apps/web/src/app/(protected)/entries/page.tsx`
  - タイトル: `text-2xl` → `text-xl md:text-2xl`
- [ ] `apps/web/src/components/entries/EntryForm.tsx`
  - textarea: `rows={8}` → `rows={5}`
- [ ] `apps/web/src/components/entries/Pagination.tsx`
  - 表示ページ数: 最大5 → 最大3

**コミット:** `style(web): レスポンシブデザインを適用`

> ※ このコミットは `feat/responsive` ブランチに含める → PR4 作成

---

## Phase 3-F: デプロイ準備

- [ ] `.env.example` に `CORS_ORIGIN` を追加
- [ ] CORS 設定確認（`apps/api/src/index.ts` — 既に環境変数対応済み、変更不要を確認）
- [ ] Cookie/トークン管理確認（localStorage 方式のため SameSite 設定不要を確認）

**コミット:** `chore: デプロイ用の環境変数設定を追加`

> ※ このコミットは `feat/deploy-prep` ブランチに含める → PR5 作成

---

## Phase 3-G: 検証・整備

- [ ] `pnpm lint` — リントエラーなし
- [ ] `pnpm build` — ビルド成功
- [ ] `pnpm format` — フォーマット修正
- [ ] `pnpm test` — テスト通過
- [ ] 手動テスト
  - テンプレート作成 → 編集 → デフォルト設定 → 日記新規作成で自動反映 → 削除
  - ヘッダーナビゲーション遷移確認（全ページ）
  - モバイルでハンバーガーメニュー動作確認
  - DevTools で 375px / 768px / 1280px 表示確認
- [ ] 全 PR（PR1〜PR5）のマージを確認

**コミット（必要に応じて）:** `style: フォーマット修正`
