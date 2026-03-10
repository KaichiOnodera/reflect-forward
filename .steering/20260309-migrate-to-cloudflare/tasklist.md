# Cloudflare 移行 — タスクリスト

## PR 戦略

| PR   | ブランチ名            | 内容                                                    |
| ---- | --------------------- | ------------------------------------------------------- |
| PR 1 | `feat/cloudflare-api` | バックエンド CF Workers 対応 + ステアリングドキュメント |
| PR 2 | `feat/cloudflare-web` | フロントエンド CF Pages 対応                            |
| PR 3 | `docs/adr-cloudflare` | ADR 更新（ドキュメントのみ）                            |

フェーズ C（インフラ）・D（デプロイ）・E（E2E 確認）は手動作業のため PR 不要。

---

## PR 1: バックエンド CF Workers 対応 + ステアリングドキュメント

### フェーズ A: バックエンド（Cloudflare Workers 対応）

- [x] A-1: `apps/api/src/app.ts` を新規作成し、Hono アプリ定義（ミドルウェア・ルート）を移植する
- [x] A-2: `apps/api/src/index.ts` を `src/app.ts` を import して `serve()` するだけに変更する
- [x] A-3: `apps/api/src/worker.ts` を新規作成し、CF Workers エントリポイントとして `app` を `export default` する
- [x] A-4: `apps/api/wrangler.toml` を新規作成する（`nodejs_compat` フラグ・`NODE_ENV` 変数を含む）
- [x] A-5: `@prisma/extension-accelerate` を dependencies に追加する
- [x] A-6: `wrangler` を devDependencies に追加する
- [x] A-7: `apps/api/src/lib/prisma.ts` に `withAccelerate()` 拡張を追加する
- [x] A-8: `apps/api/prisma/schema.prisma` の `datasource` に `directUrl = env("DIRECT_DATABASE_URL")` を追加する
- [x] A-9: `apps/api/package.json` に `deploy`・`dev:worker` スクリプトを追加する
- [x] A-10: ローカルの `.env` に `DIRECT_DATABASE_URL` を追加する（`DATABASE_URL` と同じ値で可）
- [x] A-11: ローカルで `pnpm dev` が正常に起動することを確認する
- [x] A-12: ローカルで `pnpm typecheck` がエラーなく通ることを確認する
- [ ] A-13: ステアリングドキュメント（`.steering/20260309-migrate-to-cloudflare/`）を含めて PR を作成し、CI が通ることを確認して `main` にマージする

---

## PR 2: フロントエンド CF Pages 対応

### フェーズ B: フロントエンド（Cloudflare Pages 対応）

- [ ] B-1: `@cloudflare/next-on-pages` を devDependencies に追加する
- [ ] B-2: `apps/web/next.config.ts` に `setupDevPlatform()` の呼び出しを追加する
- [ ] B-3: `apps/web` 内の全 route segment（`layout.tsx` / `page.tsx`）に `export const runtime = 'edge'` を追加する
- [ ] B-4: `apps/web/wrangler.toml` を新規作成する
- [ ] B-5: `apps/web/package.json` に `build:cf`・`deploy` スクリプトを追加する
- [ ] B-6: `npx @cloudflare/next-on-pages` でビルドが通ることをローカルで確認する
- [ ] B-7: Edge Runtime 非互換によるビルドエラーがある場合は修正する
- [ ] B-8: PR を作成し、CI が通ることを確認して `main` にマージする

---

## フェーズ C: インフラセットアップ（手動作業）

- [ ] C-1: Cloudflare アカウントで Workers Paid プラン（$5/月）に加入する
- [ ] C-2: Supabase でプロジェクトを作成する（リージョン: Northeast Asia / Tokyo）
- [ ] C-3: Supabase の直接接続文字列（`postgresql://...`）を取得する
- [ ] C-4: Prisma Accelerate（console.prisma.io）でプロジェクトを作成し、Supabase と接続する
- [ ] C-5: Prisma Accelerate の接続文字列（`prisma+postgres://...`）を取得する

## フェーズ D: デプロイ（手動作業）

- [ ] D-1: `apps/api` で `wrangler secret put` を使い、全シークレットを設定する（`DATABASE_URL`・`DIRECT_DATABASE_URL`・`JWT_SECRET`・`JWT_EXPIRES_IN`・`REFRESH_TOKEN_EXPIRES_IN`）
      ※ C-3・C-5 で取得した接続文字列を使用
- [ ] D-2: Supabase にマイグレーションを適用する（`DIRECT_DATABASE_URL=<supabase_url> DATABASE_URL=<accelerate_url> pnpm prisma migrate deploy`）
- [ ] D-3: `wrangler deploy`（`apps/api`）で CF Workers にデプロイし、Workers URL を確定する
- [ ] D-4: CF Pages プロジェクトを Cloudflare ダッシュボードで作成し、`NEXT_PUBLIC_API_URL` に Workers URL を設定する
- [ ] D-5: CF Pages にデプロイし、Pages URL を確定する
- [ ] D-6: `wrangler secret put CORS_ORIGIN`（Pages URL）を CF Workers に設定する
- [ ] D-7: `curl https://<workers-url>/health` で API の疎通確認をする

## フェーズ E: E2E 動作確認（手動作業）

- [ ] E-1: ユーザー登録 → ログイン → ログアウトが動作する
- [ ] E-2: 日記の作成 → 一覧表示 → 編集 → 削除が動作する
- [ ] E-3: テンプレートの作成 → デフォルト設定 → 日記作成時に自動適用される
- [ ] E-4: ページリロード後もログイン状態が維持される

---

## PR 3: ADR 更新

### フェーズ F: ドキュメント更新

- [ ] F-1: `docs/adr/0006-use-vercel-for-hosting.md` のステータスを「置き換え済み」に改訂する
- [ ] F-2: `docs/adr/0007-use-cloudflare-for-hosting.md` を新規作成し、Cloudflare 採用の決定を記録する
- [ ] F-3: PR を作成して `main` にマージする

## 完了条件

- 本番 URL で全 E2E 項目が問題なく動作すること
- CF Workers・Supabase のダッシュボードでエラーログが出ていないこと
- ADR が最新の決定内容を反映していること
