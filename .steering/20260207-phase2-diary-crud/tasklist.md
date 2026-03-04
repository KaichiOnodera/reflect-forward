# Phase 2: 日記 CRUD — タスクリスト

## ブランチ戦略

`main` から `feature/phase-2-diary-crud` ブランチを作成し、API と Web をまとめて実装する。
規模に応じて API 完了時点で中間 PR を作成するか、最後にまとめて PR を作成するかは実装時に判断する。

---

## Phase 2-A: shared パッケージ — カレンダースキーマ追加

- [x] `packages/shared/src/validations/entry.ts` に `calendarQuerySchema` と `CalendarQuery` 型を追加

**コミット:** `feat(shared): カレンダー用バリデーションスキーマを追加`

---

## Phase 2-B: API — Repository 層

- [x] `apps/api/src/repositories/entryRepository.ts` を作成
  - `findByUserId(userId, { page, limit, from, to, rating })` — 一覧取得
  - `countByUserId(userId, { from, to, rating })` — 件数取得
  - `findById(id)` — 単一取得
  - `create(data)` — 作成
  - `update(id, data)` — 更新
  - `delete(id)` — 削除
  - `getCalendarData(userId, year, month)` — カレンダー集計（groupBy）

**コミット:** `feat(api): 日記のリポジトリ層を実装`

---

## Phase 2-C: API — Service 層

- [x] `apps/api/src/services/entryService.ts` を作成
  - `EntryError` クラス（code: "NOT_FOUND"）
  - `list(userId, query)` — 一覧 + pagination
  - `getById(userId, entryId)` — 所有権チェック付き取得
  - `create(userId, input)` — 作成
  - `update(userId, entryId, input)` — 所有権チェック付き更新
  - `delete(userId, entryId)` — 所有権チェック付き削除
  - `getCalendar(userId, year, month)` — カレンダーデータ
  - `formatEntryDate(date)` — Date → "YYYY-MM-DD" 変換ヘルパー

**コミット:** `feat(api): 日記のサービス層を実装`

---

## Phase 2-D: API — ルート

- [x] `apps/api/src/routes/entries.ts` を作成
  - `entries.use("*", authMiddleware)` で全ルートに認証を適用
  - `GET /` — 一覧（zValidator query: listEntriesQuerySchema）
  - `POST /` — 作成（zValidator json: createEntrySchema）
  - `GET /calendar` — カレンダー（zValidator query: calendarQuerySchema）※ `:id` より先に定義
  - `GET /:id` — 詳細
  - `PUT /:id` — 更新（zValidator json: updateEntrySchema）
  - `DELETE /:id` — 削除
- [x] `apps/api/src/index.ts` に `app.route("/api/entries", entriesRoutes)` を追加

**コミット:** `feat(api): 日記のAPIルートを実装`

---

## Phase 2-E: Web — API クライアント拡張

- [x] `apps/web/src/lib/api.ts` にレスポンス型を追加
  - `EntryResponse`, `EntryListResponse`, `CalendarEntry`, `CalendarResponse`
- [x] `api` オブジェクトにメソッドを追加
  - `getEntries(params?)`, `getEntry(id)`, `createEntry(data)`, `updateEntry(id, data)`, `deleteEntry(id)`, `getCalendar(year, month)`

**コミット:** `feat(web): APIクライアントに日記メソッドを追加`

---

## Phase 2-F: Web — 日記コンポーネント

- [x] `apps/web/src/components/entries/RatingStars.tsx`
  - 表示・入力両対応、size バリアント、クリックでトグル
- [x] `apps/web/src/components/entries/EntryForm.tsx`
  - mode: create/edit、Zod バリデーション、残り文字数表示
- [x] `apps/web/src/components/entries/EntryCard.tsx`
  - 日付（曜日付き）+ 評価 + 一言メモ抜粋、クリックで詳細遷移
- [x] `apps/web/src/components/entries/EntryDetail.tsx`
  - 日付 + 評価 + 一言メモ + 本文、編集・削除ボタン
- [x] `apps/web/src/components/entries/Calendar.tsx`
  - 月表示グリッド、日記あり日に星表示、前月・次月ナビ
- [x] `apps/web/src/components/entries/Pagination.tsx`
  - 前へ・次へ + ページ番号、totalPages ≤ 1 で非表示

**コミット:** `feat(web): 日記コンポーネントを実装`

---

## Phase 2-G: Web — 日記ページ

- [x] `apps/web/src/app/(protected)/entries/page.tsx` — 一覧ページ
  - EntryCard リスト + Pagination + 「新規作成」ボタン
- [x] `apps/web/src/app/(protected)/entries/new/page.tsx` — 作成ページ
  - EntryForm (create) + クエリパラメータ `date` で日付プリセット対応
- [x] `apps/web/src/app/(protected)/entries/[id]/page.tsx` — 詳細ページ
  - EntryDetail + 削除確認（window.confirm）
- [x] `apps/web/src/app/(protected)/entries/[id]/edit/page.tsx` — 編集ページ
  - EntryForm (edit) + 既存データ読み込み
- [x] `apps/web/src/app/(protected)/entries/calendar/page.tsx` — カレンダーページ
  - Calendar + 日付クリックで一覧 or 新規作成に遷移

**コミット:** `feat(web): 日記ページを実装`

---

## Phase 2-H: Web — ダッシュボード拡張

- [x] `apps/web/src/app/(protected)/dashboard/page.tsx` を更新
  - クイックアクションカード（日記を書く、カレンダーを見る）
  - 最近の日記3件（EntryCard）
  - 「すべて見る」リンク

**コミット:** `feat(web): ダッシュボードに日記セクションを追加`

---

## Phase 2-I: 検証・整備

- [x] `pnpm lint` — リントエラーなし
- [x] `pnpm build` — ビルド成功
- [x] `pnpm format` — フォーマット修正
- [x] `pnpm test` — テスト通過（8 tests passed）
- [ ] 手動テスト
  - ダッシュボード → 「日記を書く」→ フォーム入力 → 保存 → 一覧に表示確認
  - 一覧 → 日記クリック → 詳細表示確認
  - 詳細 → 編集 → 更新 → 詳細に反映確認
  - 詳細 → 削除 → 一覧から消えていることを確認
  - カレンダー → 日記あり日クリック → 一覧フィルタ確認
  - カレンダー → 日記なし日クリック → 新規作成（日付プリセット）確認
  - ページネーション動作確認（21件以上のデータで）
- [x] PR 作成（`feature/phase-2-diary-crud` → `main`）— #28

**コミット（必要に応じて）:** `style: フォーマット修正`
