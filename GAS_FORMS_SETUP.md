# Googleフォーム作成手順

1. [Google Apps Script](https://script.google.com/)で「新しいプロジェクト」を作成します。
2. `scripts/create-cinemed-forms.gs` の内容をすべて貼り付けます。
3. 関数一覧から `createCineMedForms` を選び、1回だけ実行します。
4. 初回のGoogle権限確認を許可します。
5. Googleドライブに作成される「CineMed-AI フォーム・回答管理」フォルダを開きます。
6. 「CineMed-AI フォーム管理」スプレッドシートの「設定・URL」シートを開きます。
7. 2つの「回答用」URLをCineMed-AI管理画面に登録します。

## 作成されるもの

- 教材登録フォーム
- 利用事例報告フォーム
- 回答保存用スプレッドシート
- 教材審査台帳（未審査／審査中／採用／修正依頼／保留／不採用）
- 利用事例台帳
- フォームURL一覧

登録された教材は自動公開されません。教材審査台帳で運営が審査し、「採用」としたものだけをサイトへ追加します。

二重作成を防ぐため、`createCineMedForms` は同じGASプロジェクトでは1回だけ実行できます。URLを再確認する場合は `showCineMedFormUrls` を実行してください。
