# CineMed-AI 更新ガイド

## 基本方針

GitHubリポジトリを唯一の更新元とします。先生がコードを編集する必要はありません。GitHubを接続したCodexへ自然文で変更を依頼すると、データ修正、確認、公開まで同じ履歴に残せます。

## データの所在

- `source/google-sites-videos.json`: 元Google Sitesから取り込んだ動画・プロンプト・解説
- `source/looker-catalog.csv`: Looker Studioの正式ID・タイトル・中分類
- `source/manual-overrides.json`: 誤記、分類、診察場所などの個別修正
- `source/additional-videos.json`: 移行後に追加する動画
- `source/videos.normalized.json`: 検索サイトで使う統合済みデータ
- `source/import-report.json`: 件数、分類、照合状況
- `dist/`: ChatGPT Sites公開用
- `docs/`: GitHub Pages公開用

## 分類

- 大分類: 疾患 / 手技 / コンピテンシー / 症候
- 診察場所: 外来 / 救急 / 病棟 / その他
- 動画言語: `ja`（日本語）/ `en`（英語）/ `und`（言語未確認）
- 中分類・領域: Looker台帳の値を優先し、未照合時は元ページ区分または未整理
- 正式ID: `DISE-` / `PROC-` / `COMP-` / `SYMP-`

元台帳に安全に対応付けられない動画には正式番号を推測せず、`PENDING-` IDを付与します。同じ台帳項目に複数動画が対応する場合は、表示用IDへ `-A`、`-B` を加え、元IDを `sourceId` に保持します。

入口では日本語または英語を選択でき、検索欄上部でいつでも切り替えられます。`und` の動画は取りこぼしを避けるため、日本語・英語のどちらにも表示します。言語の誤判定は `source/manual-overrides.json` の対象動画に `"contentLanguage": "ja"` または `"en"` を指定して修正できます。

## テキストで依頼できる更新例

- 「PENDING-PROC-012をPROC-351に対応付けてください」
- 「病棟に分類されている動画のうち、外来が正しいものを修正してください」
- 「Google Drive IDが○○の動画にプロンプトを追加してください」
- 「疾患分類だけを表示したURLを案内してください」
- 「Google Driveのリンク切れを確認してください」

## 公開前の確認

1. データ生成
2. JavaScript構文確認
3. 全IDとDrive IDの重複確認
4. 主要な検索・絞り込みの確認
5. `node scripts/sync-pages.mjs` で `dist` と `docs` を同期
6. GitHubへ反映

教材登録フォームと利用報告フォームは、運営用Googleアカウントで作成した後、サイト内ボタンへURLを設定します。

## 管理画面から更新する

公開サイトの `admin.html` を開き、許可されたGoogleアカウントでログインします。動画を検索して修正すると、変更項目だけがFirestoreの `videoOverrides` コレクションへ保存され、公開画面へ反映されます。Googleフォーム作成後は「フォーム接続」で回答用URLを登録できます。

Firebase ConsoleではAuthenticationのGoogleログインを有効化し、承認済みドメインへ `hm-cmed.github.io` を追加してください。Firestoreの「ルール」タブにはリポジトリの `firestore.rules` を貼り付けて公開します。
