# 提出用メモ

## アップロードするもの

- 拡張機能：`dist/enhance-x-0.2.1.zip`
- ストアアイコン：`icons/icon128.png`
- スクリーンショット：`store/assets/screenshot-1-timeline.png`、`screenshot-2-settings.png`（各1280×800）
- 任意の小型プロモーション画像：`store/assets/promo-440x280.png`
- 掲載原稿：`store/listing-ja.md`
- プライバシーポリシーURL：https://kyoh86.dev/enhance-x/privacy/ （本文の控え：`PRIVACY.md`）

画像1は架空のタイムラインに実際のcontent scriptを適用したデモ。画像2は実際のpopup HTML/CSS/JSを、保存APIを再現した掲載用ページで表示したもの。いずれもEdge DevToolsで撮影。インストール済み拡張の実画面の撮影・検証とは異なる。

## Privacy practices 記入案

### 単一の目的

Xのページ上の不要なおすすめ・ニュース・ナビゲーション項目を利用者の設定に応じて非表示にし、タイムラインの閲覧画面を整理すること。

### storageの使用理由

8項目の非表示設定をChromeのローカルストレージに保存し、次回起動時に復元するとともに、開いているXのタブへ設定変更を反映するため。保存するのはオン・オフ設定のみ。

### サイトアクセスの使用理由（入力欄がある場合）

https://x.com/* および https://twitter.com/* 上でのみcontent scriptを実行し、見出し・リンク・タブの選択状態を参照して対象要素を非表示にするため。ホームで「おすすめ」が選択中の場合は「フォロー中」へ切り替える。ページ情報を保存・送信しない。

### リモートコード

使用しない。すべての実行コードは配布ZIPに同梱。

### データ利用の説明

開発者・第三者へのデータ収集・転送なし。表示設定のみ端末内に保存。DOM情報は表示変更のため端末内で一時参照し、保存しない。現在のダッシュボードの各データ分類の定義と、`PRIVACY.md` および実装を照合して入力する。データ販売・目的外利用・信用評価への利用は行わない。

## 提出前の残作業

1. ポリシーは https://kyoh86.dev/enhance-x/privacy/ で公開済み（2026年10月23日に認証なしでHTTP 200と本文を確認）。リポジトリ・サポートURLも公開状態でアクセスできることを確認する。ポリシー更新時は公開ページと `PRIVACY.md` を同期する。
2. 配布ZIPの読み込み・実動作の最終確認：ユーザー確認済み。デモ用スクリプト注入による検証とは区別する。
3. 8項目の個別切り替え・設定保存・別タブへの反映・最新のサブスク案内を含む最終確認について、ユーザーよりOKの報告あり。
4. Chrome Web Store開発者アカウントの登録・必要な本人確認を済ませる。
5. ZIP・画像・説明・Privacy practices・公開済みポリシーURLを登録し、内容を確認して審査へ提出する。

ストアへの登録・提出・公開はまだ行っていない。

## 再生成

画像：EdgeのDevToolsが `http://127.0.0.1:9222` で利用可能な状態で `node scripts/store-assets.mjs`。

ZIP：`python3 scripts/package.py`。許可した実行ファイル・PNGアイコン・LICENSEのみを梱包する。

## 確認した公式資料

- [画像仕様](https://developer.chrome.com/docs/webstore/images)
- [Privacy practices](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [ユーザーデータの取り扱い](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)

仕様確認日：2026年10月23日。提出時はダッシュボードの最新の案内に従う。
