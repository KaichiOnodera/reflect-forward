# ADR-0005: 開発環境に devContainer を採用

## ステータス
採用

## コンテキスト
開発環境のセットアップを効率化し、環境差異による問題を防ぐ必要がある。
また、Docker/Dockerfile の学習機会を確保したい。

## 決定
VS Code の devContainer 機能を採用し、開発環境をコンテナ化する。
devContainer 用と本番デプロイ用の2種類の Dockerfile を作成する。

## 理由

### 環境の一貫性
- 「自分の環境では動くのに」問題を防止
- Node.js、pnpm のバージョンを固定
- 必要なツールが揃った状態で開発開始

### 学習価値
- Dockerfile の書き方を学べる
- コンテナ技術の理解
- 本番環境構築のスキル

### チーム開発への準備
- 新メンバーのオンボーディングが容易
- 環境構築手順のドキュメント化が不要

## 検討した選択肢

### 選択肢1: ローカル直接インストール
- メリット:
  - シンプル、すぐ始められる
  - パフォーマンスが良い
- デメリット:
  - 環境差異が生じやすい
  - Node.js バージョン管理が煩雑
  - Dockerfile を書く機会がない

### 選択肢2: Docker Compose のみ
- メリット:
  - コンテナ化のメリットを享受
  - Dockerfile を書ける
- デメリット:
  - VS Code との統合が弱い
  - エディタ拡張機能の管理が別途必要

### 選択肢3: GitHub Codespaces
- メリット:
  - クラウドで開発、端末を選ばない
  - devContainer と互換
- デメリット:
  - ネットワーク必須
  - 無料枠に制限あり

## 影響

### ポジティブ
- 環境構築の手間削減
- Dockerfile 学習の機会
- 本番環境との一貫性

### ネガティブ
- Docker Desktop のインストールが必要
- マシンリソースを消費

## 構成

```
.devcontainer/
├── devcontainer.json   # devContainer 設定
└── Dockerfile          # 開発環境用 Dockerfile

apps/api/
└── Dockerfile          # 本番デプロイ用 Dockerfile
```

### 開発環境 Dockerfile の特徴
- Node.js 20
- pnpm インストール済み
- Git、vim 等の開発ツール
- PostgreSQL クライアント

### 本番 Dockerfile の特徴
- マルチステージビルド
- 最小限のランタイムイメージ
- セキュリティ考慮

## 関連
- ADR-0001: モノレポ構成
