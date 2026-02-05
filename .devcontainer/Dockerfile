FROM node:20-bookworm

# 開発ツールインストール
RUN apt-get update && apt-get install -y \
    git \
    vim \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# pnpm の設定
# PNPM_HOME を定義し、PATH に追加することでグローバルインストールを可能にします
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# pnpm インストール
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Turbo グローバルインストール（これで PATH が通っているので成功します）
RUN pnpm add -g turbo@2.3.3

# 作業ディレクトリ
RUN mkdir -p /workspaces
WORKDIR /workspaces
RUN chown -R node:node /workspaces

# rootのままビルドを終え、実行ユーザーは devcontainer.json に任せる
