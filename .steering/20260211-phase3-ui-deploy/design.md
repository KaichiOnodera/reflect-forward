# Phase 3: UI/UX 改善 + デプロイ準備 — 設計

## 設計方針

Phase 1・2 で確立したパターンを踏襲する。

| 項目               | 方針                                                    |
| ------------------ | ------------------------------------------------------- |
| API アーキテクチャ | templateRepository → templateService → templates ルート |
| バリデーション     | shared パッケージに新規スキーマ追加                     |
| フォーム           | useState + Zod（EntryForm と同パターン）                |
| エラーハンドリング | `TemplateError` クラス（EntryError と同形式）           |
| レスポンシブ       | Tailwind のブレークポイント（`sm:`, `md:`）で対応       |
| ヘッダー           | モバイルはハンバーガーメニュー、useState で開閉管理     |

---

## 変更ファイル一覧

### 新規作成

**shared パッケージ（2ファイル）**

| ファイル                                      | 概要                        |
| --------------------------------------------- | --------------------------- |
| `packages/shared/src/types/template.ts`       | `DiaryTemplate` 型定義      |
| `packages/shared/src/validations/template.ts` | テンプレート用 Zod スキーマ |

**API（4ファイル）**

| ファイル                                                  | 概要                                 |
| --------------------------------------------------------- | ------------------------------------ |
| `apps/api/src/repositories/templateRepository.ts`         | DiaryTemplate の DB アクセス層       |
| `apps/api/src/services/templateService.ts`                | テンプレートのビジネスロジック       |
| `apps/api/src/services/__tests__/templateService.test.ts` | テンプレートサービスのユニットテスト |
| `apps/api/src/routes/templates.ts`                        | 7 エンドポイントのルート定義         |

**Web テンプレート（5ファイル）**

| ファイル                                                    | 概要                   |
| ----------------------------------------------------------- | ---------------------- |
| `apps/web/src/app/(protected)/templates/page.tsx`           | テンプレート一覧ページ |
| `apps/web/src/app/(protected)/templates/new/page.tsx`       | テンプレート作成ページ |
| `apps/web/src/app/(protected)/templates/[id]/edit/page.tsx` | テンプレート編集ページ |
| `apps/web/src/components/templates/TemplateForm.tsx`        | 作成・編集共通フォーム |
| `apps/web/src/components/templates/TemplateCard.tsx`        | 一覧用カード           |

**レイアウト（2ファイル）**

| ファイル                                    | 概要            |
| ------------------------------------------- | --------------- |
| `apps/web/src/components/layout/Header.tsx` | ヘッダー + ナビ |
| `apps/web/src/components/layout/Footer.tsx` | フッター        |

### 修正

| ファイル                                            | 変更内容                             |
| --------------------------------------------------- | ------------------------------------ |
| `packages/shared/src/index.ts`                      | テンプレート型・スキーマを re-export |
| `apps/api/prisma/schema.prisma`                     | DiaryTemplate モデル追加             |
| `apps/api/src/index.ts`                             | templates ルートをマウント           |
| `apps/web/src/lib/api.ts`                           | テンプレート API メソッド追加        |
| `apps/web/src/app/(protected)/entries/new/page.tsx` | デフォルトテンプレート自動適用       |
| `apps/web/src/components/entries/EntryForm.tsx`     | `defaultContent` prop 追加           |
| `apps/web/src/app/(protected)/layout.tsx`           | Header/Footer 統合                   |
| `apps/web/src/app/page.tsx`                         | レスポンシブ対応                     |
| `apps/web/src/components/ui/Card.tsx`               | パディングレスポンシブ               |
| `apps/web/src/components/entries/Calendar.tsx`      | セル高さ・タッチターゲット調整       |
| `apps/web/src/app/(protected)/entries/page.tsx`     | ヘッダー配置レスポンシブ             |
| `apps/web/src/components/entries/Pagination.tsx`    | モバイルでページ数制限               |
| `.env.example`                                      | `CORS_ORIGIN` 追加                   |

---

## shared 詳細設計

### types/template.ts

```typescript
export interface DiaryTemplate {
  id: string;
  userId: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### validations/template.ts

```typescript
export const createTemplateSchema = z.object({
  name: z.string().min(1, "名前を入力してください").max(50, "名前は50文字以内で入力してください"),
  content: z
    .string()
    .min(1, "内容を入力してください")
    .max(10000, "内容は10000文字以内で入力してください"),
});

export const updateTemplateSchema = z
  .object({
    name: z
      .string()
      .min(1, "名前を入力してください")
      .max(50, "名前は50文字以内で入力してください")
      .optional(),
    content: z
      .string()
      .min(1, "内容を入力してください")
      .max(10000, "内容は10000文字以内で入力してください")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "更新する項目を1つ以上指定してください");

export const templateIdParamSchema = z.object({
  id: z.string().uuid("無効なIDです"),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type TemplateIdParam = z.infer<typeof templateIdParamSchema>;
```

### index.ts への追加

```typescript
export * from "./types/template.js";
export * from "./validations/template.js";
```

---

## API 詳細設計

### Prisma スキーマ（DiaryTemplate モデル）

```prisma
model DiaryTemplate {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  name      String   @db.VarChar(50)
  content   String   @db.Text
  isDefault Boolean  @default(false) @map("is_default")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("diary_templates")
}
```

User モデルに `templates DiaryTemplate[]` リレーションを追加。

### templateRepository.ts

```typescript
export const templateRepository = {
  async findByUserId(userId: string),
  async findById(id: string),
  async findDefault(userId: string),
  async create(data: { userId: string; name: string; content: string }),
  async update(id: string, data: { name?: string; content?: string }),
  async delete(id: string),
  async setDefault(userId: string, templateId: string),
};
```

**setDefault の実装:**

`$transaction` を使って、同ユーザーの全テンプレートを `isDefault: false` にした後、指定テンプレートを `isDefault: true` に更新する。

```typescript
async setDefault(userId: string, templateId: string) {
  return prisma.$transaction([
    prisma.diaryTemplate.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.diaryTemplate.update({
      where: { id: templateId },
      data: { isDefault: true },
    }),
  ]);
}
```

### templateService.ts

```typescript
export class TemplateError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND"
  ) {
    super(message);
    this.name = "TemplateError";
  }
}

export const templateService = {
  async list(userId: string),
  async getById(userId: string, templateId: string),
  async getDefault(userId: string),
  async create(userId: string, input: { name: string; content: string }),
  async update(userId: string, templateId: string, input: { name?: string; content?: string }),
  async delete(userId: string, templateId: string),
  async setDefault(userId: string, templateId: string),
};
```

**所有権チェック:** entryService と同じパターン。`findById` → `userId` 照合 → 不一致で `TemplateError("NOT_FOUND")`。

**formatTemplate ヘルパー:**

```typescript
function formatTemplate(template: {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: template.id,
    name: template.name,
    content: template.content,
    isDefault: template.isDefault,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
```

### templates.ts（ルート）

```typescript
const templates = new Hono<{ Variables: Variables }>();

templates.use("*", authMiddleware);

// /default は /:id より先に定義
templates.get("/", ...);
templates.post("/", zValidator("json", createTemplateSchema), ...);
templates.get("/default", ...);
templates.get("/:id", zValidator("param", templateIdParamSchema), ...);
templates.put("/:id", zValidator("param", templateIdParamSchema), zValidator("json", updateTemplateSchema), ...);
templates.delete("/:id", zValidator("param", templateIdParamSchema), ...);
templates.put("/:id/default", zValidator("param", templateIdParamSchema), ...);
```

**index.ts への追加:**

```typescript
app.route("/api/templates", templatesRoutes);
```

### templateService テスト

entryService.test.ts と同パターンで以下をテスト:

- `list`: ユーザーのテンプレート一覧を返す
- `getById`: 自分のテンプレートを取得 / 存在しない場合 TemplateError / 他ユーザーで TemplateError
- `getDefault`: デフォルトテンプレートを返す / 未設定で TemplateError
- `create`: テンプレートを作成して返す
- `update`: 自分のテンプレートを更新 / 権限チェック
- `delete`: 自分のテンプレートを削除 / 権限チェック
- `setDefault`: デフォルト設定 / 権限チェック

---

## Web テンプレート詳細設計

### api.ts への追加

**レスポンス型:**

```typescript
export interface TemplateResponse {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**API メソッド:**

```typescript
getTemplates() {
  return apiFetch<{ templates: TemplateResponse[] }>("/api/templates");
},

getTemplate(id: string) {
  return apiFetch<{ template: TemplateResponse }>(`/api/templates/${id}`);
},

getDefaultTemplate() {
  return apiFetch<{ template: TemplateResponse }>("/api/templates/default");
},

createTemplate(data: { name: string; content: string }) {
  return apiFetch<{ template: TemplateResponse }>("/api/templates", {
    method: "POST",
    body: JSON.stringify(data),
  });
},

updateTemplate(id: string, data: { name?: string; content?: string }) {
  return apiFetch<{ template: TemplateResponse }>(`/api/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
},

deleteTemplate(id: string) {
  return apiFetch<{ message: string }>(`/api/templates/${id}`, {
    method: "DELETE",
  });
},

setDefaultTemplate(id: string) {
  return apiFetch<{ message: string }>(`/api/templates/${id}/default`, {
    method: "PUT",
  });
},
```

### TemplateForm

| Props          | 型                        | 説明               |
| -------------- | ------------------------- | ------------------ |
| `mode`         | `"create" \| "edit"`      | モード             |
| `initialData?` | `TemplateResponse`        | 編集時の初期値     |
| `onSubmit`     | `(data) => Promise<void>` | 送信時コールバック |
| `onCancel`     | `() => void`              | キャンセル時       |

- EntryForm と同じ useState + Zod safeParse パターン
- フィールド: name（input, 50文字制限）, content（textarea）
- 送信中は Button の isLoading 表示

### TemplateCard

| Props          | 型                     | 説明               |
| -------------- | ---------------------- | ------------------ |
| `template`     | `TemplateResponse`     | テンプレートデータ |
| `onSetDefault` | `(id: string) => void` | デフォルト設定     |
| `onDelete`     | `(id: string) => void` | 削除               |

- Card ベース、名前 + デフォルトバッジ + content プレビュー（最初の100文字）
- 編集リンク + デフォルト設定ボタン + 削除ボタン

### テンプレート一覧ページ `/templates`

- `useEffect` + `useState` でテンプレート一覧を取得
- TemplateCard のリスト表示
- 「新規作成」ボタン → `/templates/new`
- デフォルト設定・削除時はリストを再取得

### テンプレート作成ページ `/templates/new`

- TemplateForm (mode: "create")
- onSubmit: `api.createTemplate(data)` → `router.push("/templates")`
- onCancel: `router.push("/templates")`

### テンプレート編集ページ `/templates/[id]/edit`

- `useEffect` で `api.getTemplate(id)` を呼び出し
- TemplateForm (mode: "edit", initialData: template)
- onSubmit: `api.updateTemplate(id, data)` → `router.push("/templates")`
- onCancel: `router.push("/templates")`

### 日記新規作成へのテンプレート自動適用

**`apps/web/src/components/entries/EntryForm.tsx` の変更:**

- `defaultContent?: string` prop を追加
- content の初期値: `initialData?.content ?? defaultContent ?? ""`

**`apps/web/src/app/(protected)/entries/new/page.tsx` の変更:**

- `useEffect` で `api.getDefaultTemplate()` を呼び出し（エラーは無視、デフォルト未設定は正常）
- 取得した content を `EntryForm` の `defaultContent` prop に渡す

---

## ヘッダー/フッター詳細設計

### Header コンポーネント

```
デスクトップ:
┌──────────────────────────────────────────────────────────┐
│ Reflect Forward   ダッシュボード  日記一覧  カレンダー  テンプレート   [User] [ログアウト] │
└──────────────────────────────────────────────────────────┘

モバイル:
┌──────────────────────────────┐
│ Reflect Forward          [≡] │
├──────────────────────────────┤
│ ダッシュボード               │ ← ハンバーガー展開時
│ 日記一覧                     │
│ カレンダー                   │
│ テンプレート                 │
│ ────────────                 │
│ [User]                       │
│ ログアウト                   │
└──────────────────────────────┘
```

- `useState` で `isMenuOpen` を管理
- ナビリンクは `usePathname()` で現在パスを取得し、アクティブなリンクをハイライト
- デスクトップ: `hidden md:flex` でナビ表示
- モバイル: `md:hidden` でハンバーガーアイコン表示、クリックでメニュー開閉
- ナビリンクをクリックしたらメニューを閉じる

### Footer コンポーネント

```html
<footer class="border-t bg-white py-4 text-center text-sm text-gray-500">
  © 2026 Reflect Forward
</footer>
```

### Protected レイアウトの変更

```tsx
// 変更前: インラインヘッダー
<div className="min-h-screen bg-gray-50">
  <header>...</header>
  <main>...</main>
</div>

// 変更後: Header/Footer コンポーネント
<div className="flex min-h-screen flex-col bg-gray-50">
  <Header user={user} />
  <main className="mx-auto max-w-7xl flex-1 px-4 py-8">{children}</main>
  <Footer />
</div>
```

`flex-col` + `flex-1` でフッターを常にページ下部に配置する。

---

## レスポンシブ詳細設計

### ランディングページ (`apps/web/src/app/page.tsx`)

| 要素       | 変更前       | 変更後                            |
| ---------- | ------------ | --------------------------------- |
| パディング | `p-24`       | `p-6 md:p-24`                     |
| タイトル   | `text-4xl`   | `text-2xl md:text-4xl`            |
| ボタン群   | `flex gap-4` | `flex flex-col sm:flex-row gap-4` |

### Card コンポーネント (`apps/web/src/components/ui/Card.tsx`)

| 要素       | 変更前 | 変更後       |
| ---------- | ------ | ------------ |
| パディング | `p-8`  | `p-4 md:p-8` |

### カレンダー (`apps/web/src/components/entries/Calendar.tsx`)

| 要素             | 変更前 | 変更後                     |
| ---------------- | ------ | -------------------------- |
| セル高さ         | `h-14` | `h-10 sm:h-14`             |
| タッチターゲット | なし   | `min-h-[44px]`（モバイル） |

### 日記一覧ページ (`apps/web/src/app/(protected)/entries/page.tsx`)

| 要素     | 変更前                              | 変更後                     |
| -------- | ----------------------------------- | -------------------------- |
| ヘッダー | `flex items-center justify-between` | 変更なし（現状で問題なし） |
| タイトル | `text-2xl`                          | `text-xl md:text-2xl`      |

### 日記フォーム (`apps/web/src/components/entries/EntryForm.tsx`)

| 要素          | 変更前     | 変更後     |
| ------------- | ---------- | ---------- |
| textarea rows | `rows={8}` | `rows={5}` |

### ページネーション (`apps/web/src/components/entries/Pagination.tsx`)

| 要素         | 変更前 | 変更後          |
| ------------ | ------ | --------------- |
| 表示ページ数 | 最大5  | モバイルで最大3 |

モバイル判定は CSS ではなくウィンドウ幅で制御が必要なため、表示ページ数の最大値を 5 から **3 に変更**（デスクトップでも 3 で十分）。

---

## デプロイ準備詳細設計

### .env.example への追加

```
# ----- CORS -----
# 本番環境: フロントエンドのURL
# CORS_ORIGIN=https://your-app.vercel.app
CORS_ORIGIN=http://localhost:3000
```

### CORS 設定確認

`apps/api/src/index.ts` の CORS 設定は既に `process.env.CORS_ORIGIN` を使用しており、本番環境では環境変数で制御可能。変更不要。

### Cookie 設定確認

現在の実装はリフレッシュトークンを localStorage で管理しており、Cookie ではない。そのため `SameSite` / `Secure` の設定変更は不要。

---

## エラーハンドリング

| エラー             | API レスポンス | Web での表示                 |
| ------------------ | -------------- | ---------------------------- |
| バリデーション失敗 | 400 (Zod 自動) | フィールド下に赤字           |
| 未認証             | 401            | ログインページにリダイレクト |
| テンプレート未発見 | 404            | メッセージ表示               |
| サーバーエラー     | 500            | 汎用エラーメッセージ表示     |
