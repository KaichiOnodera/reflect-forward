# Phase 2: 日記 CRUD — 設計

## 設計方針

Phase 1 で確立したパターン（Repository → Service → Route、useState + Zod フォーム等）を踏襲する。

| 項目               | 方針                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| API アーキテクチャ | entryRepository → entryService → entries ルート                        |
| バリデーション     | shared パッケージの既存 Zod スキーマを使用。カレンダー用スキーマを追加 |
| フォーム           | useState + Zod（Phase 1 LoginForm/RegisterForm と同じパターン）        |
| 作成・編集共通化   | `EntryForm` コンポーネント（mode: create/edit）で共通化                |
| ページネーション   | オフセットベース（page/limit）                                         |
| 削除確認           | window.confirm（Modal コンポーネントは将来対応）                       |
| エラーハンドリング | Phase 1 と同じ ApiError パターン                                       |

---

## 変更ファイル一覧

### 新規作成

**shared パッケージ（1ファイル）**

| ファイル                                   | 概要                         |
| ------------------------------------------ | ---------------------------- |
| `packages/shared/src/validations/entry.ts` | `calendarQuerySchema` を追加 |

**API（3ファイル）**

| ファイル                                       | 概要                                  |
| ---------------------------------------------- | ------------------------------------- |
| `apps/api/src/repositories/entryRepository.ts` | DiaryEntry の DB アクセス層           |
| `apps/api/src/services/entryService.ts`        | 日記のビジネスロジック + `EntryError` |
| `apps/api/src/routes/entries.ts`               | 6 エンドポイントのルート定義          |

**Web コンポーネント（6ファイル）**

| ファイル                                          | 概要                   |
| ------------------------------------------------- | ---------------------- |
| `apps/web/src/components/entries/RatingStars.tsx` | 星評価の表示・入力     |
| `apps/web/src/components/entries/EntryForm.tsx`   | 作成・編集共通フォーム |
| `apps/web/src/components/entries/EntryCard.tsx`   | 一覧用カード           |
| `apps/web/src/components/entries/EntryDetail.tsx` | 詳細表示               |
| `apps/web/src/components/entries/Calendar.tsx`    | カレンダー             |
| `apps/web/src/components/entries/Pagination.tsx`  | ページネーション       |

**Web ページ（5ファイル）**

| ファイル                                                  | 概要             |
| --------------------------------------------------------- | ---------------- |
| `apps/web/src/app/(protected)/entries/page.tsx`           | 一覧ページ       |
| `apps/web/src/app/(protected)/entries/new/page.tsx`       | 作成ページ       |
| `apps/web/src/app/(protected)/entries/[id]/page.tsx`      | 詳細ページ       |
| `apps/web/src/app/(protected)/entries/[id]/edit/page.tsx` | 編集ページ       |
| `apps/web/src/app/(protected)/entries/calendar/page.tsx`  | カレンダーページ |

### 修正

| ファイル                                          | 変更内容                              |
| ------------------------------------------------- | ------------------------------------- |
| `apps/web/src/lib/api.ts`                         | 日記 API メソッド・レスポンス型を追加 |
| `apps/web/src/app/(protected)/dashboard/page.tsx` | クイックアクション + 最近の日記を表示 |
| `apps/api/src/index.ts`                           | entries ルートをマウント              |

---

## API 詳細設計

### entryRepository.ts

```typescript
export const entryRepository = {
  // 一覧取得（ページネーション + フィルタ）
  async findByUserId(userId, { page, limit, from, to, rating }),

  // 件数取得（ページネーション用）
  async countByUserId(userId, { from, to, rating }),

  // 単一取得
  async findById(id),

  // 作成
  async create(data),

  // 更新
  async update(id, data),

  // 削除
  async delete(id),

  // カレンダー用集計（指定月の日付ごとの件数・平均評価）
  async getCalendarData(userId, year, month),
};
```

**findByUserId の Prisma クエリ設計:**

```typescript
prisma.diaryEntry.findMany({
  where: {
    userId,
    ...(from && { entryDate: { gte: new Date(from) } }),
    ...(to && { entryDate: { ...where.entryDate, lte: new Date(to) } }),
    ...(rating && { rating }),
  },
  orderBy: { entryDate: "desc" },
  skip: (page - 1) * limit,
  take: limit,
});
```

**getCalendarData の設計:**

Prisma の `groupBy` を使用して日付ごとに集計する。

```typescript
prisma.diaryEntry.groupBy({
  by: ["entryDate"],
  where: {
    userId,
    entryDate: {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    },
  },
  _count: { id: true },
  _avg: { rating: true },
});
```

### entryService.ts

```typescript
export class EntryError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND"
  ) {
    super(message);
    this.name = "EntryError";
  }
}

export const entryService = {
  // 一覧取得（entries + pagination オブジェクトを返す）
  async list(userId, query),

  // 単一取得（userId で所有権チェック、非所有 → EntryError NOT_FOUND）
  async getById(userId, entryId),

  // 作成（userId を付与して保存）
  async create(userId, input),

  // 更新（所有権チェック → 更新）
  async update(userId, entryId, input),

  // 削除（所有権チェック → 削除）
  async delete(userId, entryId),

  // カレンダーデータ取得
  async getCalendar(userId, year, month),
};
```

**所有権チェックのパターン:**

すべての操作で `entryRepository.findById(id)` → `entry.userId !== userId` なら `EntryError("NOT_FOUND")` をスロー。他ユーザーの日記の存在を漏らさないよう、403 ではなく 404 を返す。

**list のレスポンス形式:**

```typescript
{
  entries: Array<{
    id: string;
    content: string | null;
    shortMemo: string | null;
    rating: number | null;
    entryDate: string; // "YYYY-MM-DD"
    createdAt: string; // ISO 8601
    updatedAt: string; // ISO 8601
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
}
```

**entryDate の変換:**

Prisma の `DateTime(@db.Date)` は JavaScript の `Date` オブジェクトを返す。レスポンスでは `"YYYY-MM-DD"` 文字列に変換する。変換ロジックは entryService 内に配置する。

```typescript
function formatEntryDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
```

### entries.ts（ルート）

```typescript
const entries = new Hono<{ Variables: Variables }>();

// すべてのルートに認証ミドルウェアを適用
entries.use("*", authMiddleware);

// カレンダーを :id より先に定義（ルートマッチ順序）
entries.get("/calendar", zValidator("query", calendarQuerySchema), ...);
entries.get("/",         zValidator("query", listEntriesQuerySchema), ...);
entries.post("/",        zValidator("json", createEntrySchema), ...);
entries.get("/:id", ...);
entries.put("/:id",      zValidator("json", updateEntrySchema), ...);
entries.delete("/:id", ...);
```

**ルートマッチ順序の注意:** `/calendar` は `/:id` より先に定義する。Hono はパスパラメータより静的パスを優先するが、明示的に先に定義しておく。

**index.ts への追加:**

```typescript
app.route("/api/entries", entriesRoutes);
```

### calendarQuerySchema（shared に追加）

```typescript
export const calendarQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
```

---

## Web 詳細設計

### api.ts への追加

**レスポンス型:**

```typescript
export interface EntryResponse {
  id: string;
  content: string | null;
  shortMemo: string | null;
  rating: number | null;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface EntryListResponse {
  entries: EntryResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CalendarEntry {
  date: string;
  count: number;
  avgRating: number | null;
}

export interface CalendarResponse {
  entries: CalendarEntry[];
}
```

**API メソッド:**

```typescript
// api オブジェクトに追加
getEntries(params?: { page?: number; limit?: number; from?: string; to?: string; rating?: number }) {
  const query = new URLSearchParams();
  // params を query string に変換
  return apiFetch<EntryListResponse>(`/api/entries?${query}`);
},

getEntry(id: string) {
  return apiFetch<{ entry: EntryResponse }>(`/api/entries/${id}`);
},

createEntry(data: { ... }) {
  return apiFetch<{ entry: EntryResponse }>("/api/entries", {
    method: "POST",
    body: JSON.stringify(data),
  });
},

updateEntry(id: string, data: { ... }) {
  return apiFetch<{ entry: EntryResponse }>(`/api/entries/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
},

deleteEntry(id: string) {
  return apiFetch<{ message: string }>(`/api/entries/${id}`, {
    method: "DELETE",
  });
},

getCalendar(year: number, month: number) {
  return apiFetch<CalendarResponse>(`/api/entries/calendar?year=${year}&month=${month}`);
},
```

### コンポーネント設計

#### RatingStars

| Props       | 型                                | 説明                             |
| ----------- | --------------------------------- | -------------------------------- |
| `value`     | `number \| null`                  | 現在の評価（1-5、null は未設定） |
| `onChange?` | `(value: number \| null) => void` | 変更時（省略で読み取り専用）     |
| `size?`     | `"sm" \| "md" \| "lg"`            | サイズ（デフォルト: "md"）       |

- 星をクリック → その値を設定、同じ星を再クリック → null（クリア）
- `onChange` がなければ表示のみ

#### EntryForm

| Props          | 型                        | 説明               |
| -------------- | ------------------------- | ------------------ |
| `mode`         | `"create" \| "edit"`      | モード             |
| `initialData?` | `EntryResponse`           | 編集時の初期値     |
| `onSubmit`     | `(data) => Promise<void>` | 送信時コールバック |
| `onCancel`     | `() => void`              | キャンセル時       |

- フィールド: entryDate（date input、作成時は今日デフォルト）、rating（RatingStars）、shortMemo（input + 残り文字数）、content（textarea）
- バリデーション: `createEntrySchema` / `updateEntrySchema`（shared）
- 送信中は Button の isLoading 表示
- LoginForm と同じパターン（useState + safeParse + ApiError ハンドリング）

#### EntryCard

| Props   | 型              | 説明       |
| ------- | --------------- | ---------- |
| `entry` | `EntryResponse` | 日記データ |

- Card コンポーネントをベースに、日付・曜日・評価・一言メモ抜粋を表示
- クリックで詳細ページ（`/entries/[id]`）に遷移（Link or router.push）
- entryDate の表示形式: `2026年2月4日（火）`

#### EntryDetail

| Props      | 型              | 説明       |
| ---------- | --------------- | ---------- |
| `entry`    | `EntryResponse` | 日記データ |
| `onEdit`   | `() => void`    | 編集ボタン |
| `onDelete` | `() => void`    | 削除ボタン |

- 日付 + 評価（RatingStars readonly）+ 一言メモ + 本文を表示
- 編集・削除ボタン

#### Calendar

| Props           | 型                                      | 説明                 |
| --------------- | --------------------------------------- | -------------------- |
| `year`          | `number`                                | 表示年               |
| `month`         | `number`                                | 表示月（1-12）       |
| `entries`       | `CalendarEntry[]`                       | 日付ごとの記録データ |
| `onDateClick`   | `(date: string) => void`                | 日付クリック時       |
| `onMonthChange` | `(year: number, month: number) => void` | 月変更時             |

- 日〜土の7列グリッド
- 日記がある日は評価の星を表示（色分け）
- 前月・次月ボタン

#### Pagination

| Props          | 型                       | 説明         |
| -------------- | ------------------------ | ------------ |
| `page`         | `number`                 | 現在のページ |
| `totalPages`   | `number`                 | 総ページ数   |
| `onPageChange` | `(page: number) => void` | ページ変更時 |

- 「前へ」「次へ」 + ページ番号ボタン
- 現在ページはハイライト
- totalPages が 1 以下のときは非表示

### ページ設計

#### `/entries`（一覧）

- `useEffect` + `useState` で日記一覧を取得
- `api.getEntries({ page })` を呼び出し
- EntryCard のリスト + Pagination
- 「新規作成」ボタン → `/entries/new`
- ページ変更時に再取得

#### `/entries/new`（作成）

- `EntryForm` (mode: "create")
- onSubmit: `api.createEntry(data)` → `router.push("/entries")`
- onCancel: `router.push("/entries")`

#### `/entries/[id]`（詳細）

- `useEffect` で `api.getEntry(id)` を呼び出し
- EntryDetail を表示
- 編集: `router.push(`/entries/${id}/edit`)`
- 削除: `window.confirm` → `api.deleteEntry(id)` → `router.push("/entries")`
- 「一覧に戻る」リンク

#### `/entries/[id]/edit`（編集）

- `useEffect` で `api.getEntry(id)` を呼び出し
- `EntryForm` (mode: "edit", initialData: entry)
- onSubmit: `api.updateEntry(id, data)` → `router.push(`/entries/${id}`)`
- onCancel: `router.push(`/entries/${id}`)`

#### `/entries/calendar`（カレンダー）

- `useState` で year/month を管理（初期値: 今月）
- `useEffect` で `api.getCalendar(year, month)` を呼び出し
- Calendar コンポーネントを表示
- 日付クリック: 日記あり → `/entries/[id]`（ただし calendar API は id を返さないので `/entries?from=DATE&to=DATE` に遷移）、日記なし → `/entries/new?date=DATE`

### ダッシュボード拡張

現在のプレースホルダーを以下に置き換え:

- クイックアクションカード2つ: 「日記を書く」→ `/entries/new`、「カレンダーを見る」→ `/entries/calendar`
- 「最近の日記」セクション: `api.getEntries({ limit: 3 })` で取得、EntryCard で表示
- 「すべて見る」リンク → `/entries`

---

## カレンダーの日付クリック動作について

functional-design.md では「日付クリック（日記あり）→ EntryDetail」となっているが、calendar API は `{ date, count, avgRating }` を返し、entry ID を含まない（1日に複数日記がありうるため）。

**対応方針:** 日記がある日のクリック → `/entries?from=DATE&to=DATE`（その日の日記一覧にフィルタ）。日記が1件の場合もまず一覧表示し、そこから詳細に遷移する。日記がない日のクリック → `/entries/new?date=DATE`。

---

## エラーハンドリング

| エラー             | API レスポンス | Web での表示                                    |
| ------------------ | -------------- | ----------------------------------------------- |
| バリデーション失敗 | 400 (Zod 自動) | フィールド下に赤字                              |
| 未認証             | 401            | ログインページにリダイレクト（apiFetch が処理） |
| 日記が見つからない | 404            | 「日記が見つかりません」メッセージ表示          |
| サーバーエラー     | 500            | 汎用エラーメッセージ表示                        |
