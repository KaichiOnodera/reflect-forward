# 本番デプロイ — タスクリスト

## フェーズ A: API サーバーレス対応（コード変更）

- [ ] A-1: `apps/api/src/app.ts` を新規作成し、Hono アプリ定義（ミドルウェア・ルート）を移植する
- [ ] A-2: `apps/api/src/index.ts` を `src/app.ts` を import して `serve()` するだけに変更する
- [ ] A-3: `apps/api/tsconfig.json` の `rootDir` を削除し、`api/` ディレクトリも型チェック対象に含める
- [ ] A-4: `apps/api/api/index.ts` を新規作成し、`hono/vercel` の `handle()` で Vercel エントリポイントを実装する
- [ ] A-5: `apps/api/vercel.json` を新規作成し、全リクエストを `/api` 関数にリライトする設定を追加する
- [ ] A-6: `apps/api/package.json` に `"typecheck": "tsc --noEmit"` スクリプトを追加する
- [ ] A-7: ローカルで `pnpm dev` が正常に起動することを確認する
- [ ] A-8: ローカルで `pnpm typecheck` がエラーなく通ることを確認する
- [ ] A-9: PR を作成して CI が通ることを確認し、`main` にマージする

## フェーズ B: Supabase 本番 DB 構築

- [ ] B-1: Supabase でプロジェクトを作成する（リージョン: Northeast Asia / Tokyo）
- [ ] B-2: `DATABASE_URL`（接続文字列）を取得する
- [ ] B-3: `apps/api` で `prisma migrate deploy` を実行してスキーマを本番 DB に反映する
- [ ] B-4: Supabase の Table Editor でテーブルが正しく作成されていることを確認する

## フェーズ C: Vercel デプロイ

- [ ] C-1: Vercel で Web プロジェクトを作成する（Root Directory: `apps/web`、Install/Build コマンドは design.md 参照）
- [ ] C-2: Web をデプロイして URL を確定させる（この時点では `NEXT_PUBLIC_API_URL` は未設定で問題ない。URL 確定が目的）
- [ ] C-3: Vercel で API プロジェクトを作成する（Root Directory: `apps/api`、Install/Build コマンドは design.md 参照）
- [ ] C-4: API の環境変数を Vercel ダッシュボードに設定する（`DATABASE_URL`、`JWT_SECRET`、`JWT_EXPIRES_IN`、`REFRESH_TOKEN_EXPIRES_IN`、`CORS_ORIGIN`、`NODE_ENV`）
- [ ] C-5: API をデプロイして URL を確定させる
- [ ] C-6: Web の環境変数 `NEXT_PUBLIC_API_URL` に API の URL を設定して再デプロイする
- [ ] C-7: `/health` エンドポイントにアクセスして API の疎通確認をする

## フェーズ D: E2E 動作確認

- [ ] D-1: ユーザー登録 → ログイン → ログアウトが動作する
- [ ] D-2: 日記の作成 → 一覧表示 → 編集 → 削除が動作する
- [ ] D-3: テンプレートの作成 → デフォルト設定 → 日記作成時に自動適用される
- [ ] D-4: ページリロード後もログイン状態が維持される

## 完了条件

- 本番 URL で全 E2E 項目が問題なく動作すること
- Vercel・Supabase のダッシュボードでエラーログが出ていないこと
