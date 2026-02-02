FROM node:20-bookworm

# 開発ツールインストール
RUN apt-get update && apt-get install -y \
    git \
    vim \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# pnpm インストール（バージョン固定で再現性確保）
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Turbo グローバルインストール（バージョン固定）
RUN pnpm add -g turbo@2.3.3

# 作業ディレクトリ
WORKDIR /workspace

# 非 root ユーザー設定（セキュリティ）
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

RUN if [ "$USER_GID" != "1000" ] || [ "$USER_UID" != "1000" ]; then \
    groupmod --gid $USER_GID $USERNAME \
    && usermod --uid $USER_UID --gid $USER_GID $USERNAME \
    && chown -R $USER_UID:$USER_GID /home/$USERNAME; \
    fi

USER $USERNAME
