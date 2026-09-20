# CineMed-AI

医療者教育用の生成AI動画と生成プロンプトを検索・閲覧する静的サイトです。GitHub Pagesだけで動作し、データベースや有料サーバーは不要です。

## 公開内容

- 元Google Sitesから取得した動画枠: 595件
- Google Drive IDで重複を除いた収録動画: 585件
- 大分類: 疾患 / 手技 / コンピテンシー / 症候
- 診察場所: 外来 / 救急 / 病棟 / その他
- 動画言語: 日本語 / English / 言語未確認（未確認は両方の一覧に表示）

Looker Studio台帳とタイトルを安全に照合できた動画には正式IDと中分類を付与しています。自動照合の確信度が不足する項目には、正式IDを推測せず `PENDING-` IDを付けています。

## GitHub Pagesで公開する

このリポジトリには `.github/workflows/pages.yml` が含まれています。GitHubのリポジトリ設定で Pages の公開元を `GitHub Actions` にすると、`main` ブランチへの更新時に `docs` フォルダーが公開されます。

## 更新する

通常はコードを直接編集する必要はありません。GitHubを接続したCodexに、例えば次のように依頼できます。

- 「動画ID SYMP-202 の中分類を『消化器・救急』に変更してください」
- 「このGoogle Drive動画を大分類『手技』、診察場所『病棟』で追加してください」
- 「トップページの助成情報を修正してください」
- 「Google Drive IDが○○の動画の言語を英語に変更してください」
- 「台帳未照合の動画だけを一覧にしてください」

個別修正は `source/manual-overrides.json`、新規動画は `source/additional-videos.json` に保存します。`node scripts/generate-data.mjs` で公開用データを再生成し、`node scripts/sync-pages.mjs` でGitHub Pages用の `docs` を更新します。

詳しい運用は `UPDATE_GUIDE.md` を参照してください。

## 管理画面

`docs/admin.html` から管理者用Googleアカウントでログインすると、動画情報の修正とGoogleフォームURLの設定ができます。元データはGitHubに保持し、変更項目だけをCloud Firestoreへ保存します。Firestoreのセキュリティルールは `firestore.rules` を使用します。
