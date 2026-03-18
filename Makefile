.PHONY: help setup up down restart build logs logs-f \
       client-dev client-build client-lint client-install client-preview \
       server-build server-up server-down server-restart server-logs \
       dev clean purge test test-verbose fmt check \
       server-shell server-build-debug ws-test

# ==============================================================================
# 基本設定
# ==============================================================================
CLIENT_DIR := client
SERVER_DIR := server
DOCKER_COMPOSE := docker compose
# rust:1.85 (非slim) を使用: rustfmt等のツールチェーンが完備
RUST_IMAGE := rust:1.85
# 名前付きボリュームでビルドキャッシュを永続化
RUST_RUN := docker run --rm \
	-v $(PWD)/$(SERVER_DIR):/app \
	-v yabu-cargo-cache:/app/target \
	-v yabu-cargo-registry:/usr/local/cargo/registry \
	-w /app $(RUST_IMAGE)

# ==============================================================================
# ヘルプ
# ==============================================================================
help: ## コマンド一覧を表示
	@echo ""
	@echo "藪の中 - Makefile コマンド一覧"
	@echo "=============================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ==============================================================================
# セットアップ
# ==============================================================================
setup: client-install server-build ## 初回セットアップ (依存関係インストール + サーバービルド)
	@echo "セットアップ完了"

# ==============================================================================
# 開発 (サーバー + クライアント同時起動)
# ==============================================================================
dev: server-up client-dev ## 開発環境を起動 (サーバー + クライアント)

# ==============================================================================
# Docker (サーバー)
# ==============================================================================
up: server-up ## サーバーを起動 (docker compose up)
down: server-down ## サーバーを停止 (docker compose down)
restart: server-restart ## サーバーを再起動
build: server-build ## サーバーを再ビルド
logs: server-logs ## サーバーログを表示
logs-f: ## サーバーログをフォロー表示
	$(DOCKER_COMPOSE) logs -f server

server-build: ## Dockerイメージをビルド
	$(DOCKER_COMPOSE) build

server-up: ## サーバーをバックグラウンドで起動
	$(DOCKER_COMPOSE) up -d

server-down: ## サーバーを停止・コンテナ削除
	$(DOCKER_COMPOSE) down

server-restart: server-down server-up ## サーバーを再起動

server-logs: ## サーバーログを表示
	$(DOCKER_COMPOSE) logs server

# ==============================================================================
# クライアント
# ==============================================================================
client-install: ## クライアント依存関係をインストール
	cd $(CLIENT_DIR) && npm install

client-dev: ## クライアント開発サーバーを起動 (port 5173)
	cd $(CLIENT_DIR) && npm run dev

client-build: ## クライアントを本番ビルド
	cd $(CLIENT_DIR) && npm run build

client-lint: ## クライアントのlintを実行
	cd $(CLIENT_DIR) && npm run lint

client-preview: ## クライアントの本番ビルドをプレビュー
	cd $(CLIENT_DIR) && npm run preview

# ==============================================================================
# 品質チェック
# ==============================================================================
check: client-lint ## 全体の品質チェック (lint)
	@echo "チェック完了"

fmt: ## Rustコードのフォーマット (Docker経由)
	$(RUST_RUN) cargo fmt

# ==============================================================================
# テスト
# ==============================================================================
test: ## Rustのテストを実行 (Docker経由)
	$(RUST_RUN) cargo test

test-verbose: ## Rustのテストを詳細出力で実行
	$(RUST_RUN) cargo test -- --nocapture

# ==============================================================================
# デバッグ
# ==============================================================================
server-shell: ## サーバーコンテナ内でシェルを起動
	$(DOCKER_COMPOSE) exec server /bin/bash

server-build-debug: ## デバッグビルド (Docker経由, 高速コンパイル)
	$(RUST_RUN) cargo build 2>&1

ws-test: ## WebSocket接続テスト (サーバーが起動している前提)
	@echo '{"type":"create_room","name":"テスト"}' | \
		npx -y wscat -c ws://localhost:8080/ws -x 2>/dev/null || \
		echo "サーバーに接続できません。make up を先に実行してください"

# ==============================================================================
# クリーンアップ
# ==============================================================================
clean: ## ビルド成果物を削除
	rm -rf $(CLIENT_DIR)/dist
	@echo "クリーン完了"

purge: clean server-down ## 全てを停止・削除 (コンテナ, イメージ, node_modules, キャッシュ)
	rm -rf $(CLIENT_DIR)/node_modules
	$(DOCKER_COMPOSE) down --rmi local --volumes --remove-orphans 2>/dev/null || true
	docker volume rm yabu-cargo-cache yabu-cargo-registry 2>/dev/null || true
	@echo "完全クリーン完了"
