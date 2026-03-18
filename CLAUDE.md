# 藪の中 - オンラインカードゲーム

## プロジェクト概要
Oink Gamesの「藪の中」をオンライン化したWebゲーム。
- フロントエンド: React + TypeScript + Vite + Tailwind CSS (`client/`)
- バックエンド: Rust + Axum + WebSocket (`server/`, Docker で動作)

## 開発ルール

### ブランチ・PR運用
- 1機能追加 or 1バグ修正につき、必ず専用ブランチを作成する
- ブランチ名は `feat/<機能名>` または `fix/<バグ内容>` とする
- PR の作成・管理には `gh` コマンドを使用する
- main ブランチへの直接コミットは禁止
- コンフリクトが見込まれる場合、親ブランチは main ではなく関連する作業ブランチから切る

### PRレビュー
- PR を作成する前に、必ず Codex にコードレビューを依頼する
- Codex が指摘した優先度の高い問題は、PR 作成前に修正を完了すること
- レビュー → 修正 → PR作成 の順序を厳守する

### Rust バックエンド品質基準
- すべての入力値に対してバリデーションを厳密に行う
- WebSocket メッセージのパース・範囲チェック・状態遷移の妥当性を検証する
- ゲームロジックでは不正な操作（ターン外の行動、無効なインデックス等）を確実に拒否する
- `unwrap()` の使用は最小限にし、適切なエラーハンドリングを行う

## ビルド・起動

```sh
# バックエンド
docker compose up -d        # サーバー起動 (port 8080)
docker compose build         # 再ビルド
docker compose logs          # ログ確認

# フロントエンド
cd client && npm install && npm run dev   # 開発サーバー (port 5173)
```
