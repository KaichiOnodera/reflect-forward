# Cloudflare 移行 — 要求内容

## 概要

将来の商用利用を見据え、ホスティング先を Vercel から Cloudflare に移行する。
Vercel Hobby プランは商用利用不可であり、Vercel Pro は $20/月と高額なため、
Cloudflare Workers（$5/月）+ Cloudflare Pages（無料）への移行を行う。

本ドキュメントは `.steering/20260306-production-deploy/` を置き換えるものであり、
ADR-0006（Vercel 採用）も本作業で改訂する。

---

## 構成変更

### 変更前（ADR-0006 の決定内容）

| サービス | プラットフォーム | プラン         |
|---------|----------------|---------------|
| Web     | Vercel         | Hobby（無料）   |
| API     | Vercel         | Hobby（無料）   |
| DB      | Supabase       | Free          |
| DB接続  | 直接接続（TCP）  | —             |

### 変更後

| サービス | プラットフォーム          | プラン                   | 費用   |
|---------|------------------------|-------------------------|-------|
| Web     | Cloudflare Pages       | Free（商用OK）            | 無料   |
| API     | Cloudflare Workers     | Paid                    | $5/月 |
| DB      | Supabase（既存）         | Free                    | 無料   |
| DB接続  | Prisma Accelerate      | Free（100k queries/月）   | 無料   |

**月額合計: $5/月**

---

## 前提条件

- Cloudflare アカウントを作成し、Workers Paid プラン（$5/月）に加入すること
- Prisma Accelerate アカウントを作成し、Supabase と接続した接続文字列を取得すること

---

## ユーザーストーリー

| # | ストーリー |
|---|---|
| 1 | 開発者として、Hono API を Cloudflare Workers にデプロイして本番から接続できる状態にしたい |
| 2 | 開発者として、Next.js を Cloudflare Pages にデプロイして外部からアクセスできる状態にしたい |
| 3 | 開発者として、Prisma Accelerate を経由して本番 DB に接続できる状態にしたい |
| 4 | 開発者として、本番環境でE2E動作確認をして問題なくリリースしたい |
| 5 | 開発者として、`pnpm dev` によるローカル開発が引き続き問題なく動作することを確認したい |
| 6 | 開発者として、ADR-0006 を改訂して Cloudflare 採用の決定を記録したい |

---

## 技術要件

### バックエンド（Cloudflare Workers）

- Hono アプリを Cloudflare Workers にデプロイできること
- `bcryptjs`（pure JS 実装済み）は CF Workers 互換のためコード変更不要であること
- `jsonwebtoken` が CF Workers 上で動作すること（`nodejs_compat` フラグで対応）
- Prisma Accelerate を通じて Supabase（PostgreSQL）に接続できること

### フロントエンド（Cloudflare Pages）

- Next.js 15（App Router）を Cloudflare Pages にデプロイできること
- 商用利用が Cloudflare の利用規約上で認められていること

### データベース接続

- CF Workers から PostgreSQL に接続するため、Prisma Accelerate（HTTP ベースのプロキシ）を使用すること
- ローカル開発時は引き続き Docker PostgreSQL に直接接続できること（開発フローを変えない）

---

## 制約事項

- カスタムドメインは対象外（MVP 後に対応）
- Prisma Accelerate 無料枠: 100,000 queries/月（MVP 段階では十分）
- `@cloudflare/next-on-pages` の Edge Runtime 制限により、一部の Next.js 機能が動作しない可能性がある。デプロイ後に互換性を確認し、問題があればコンポーネント単位で修正する

---

## 動作確認項目

- [ ] ローカルで `pnpm dev` が正常に起動すること
- [ ] CF Workers デプロイ後: `/health` エンドポイントが応答すること
- [ ] CF Pages デプロイ後: ブラウザでアプリにアクセスできること
- [ ] ユーザー登録 → ログイン → ログアウトが動作すること
- [ ] 日記の作成 → 一覧表示 → 編集 → 削除が動作すること
- [ ] テンプレートの作成 → デフォルト設定 → 日記作成時に自動適用されること
- [ ] ページリロード後もログイン状態が維持されること
