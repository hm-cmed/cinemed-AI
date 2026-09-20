/**
 * CineMed-AI フォーム作成スクリプト
 *
 * 実行方法:
 * 1. https://script.google.com/ で新しいプロジェクトを作成
 * 2. このファイル全体を貼り付ける
 * 3. createCineMedForms を1回実行し、Googleの権限を許可する
 * 4. 実行ログ、または自動作成された「CineMed-AI フォーム管理」スプレッドシートでURLを確認する
 */

const CONFIG = {
  folderName: "CineMed-AI フォーム・回答管理",
  spreadsheetName: "CineMed-AI フォーム管理",
  materialFormTitle: "CineMed-AI 教材を登録する",
  usageFormTitle: "CineMed-AI 利用事例を報告する",
  timezone: "Asia/Tokyo",
};

function createCineMedForms() {
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty("CINEMED_SPREADSHEET_ID")) {
    throw new Error("フォームはすでに作成されています。URLの再表示は showCineMedFormUrls を実行してください。");
  }

  const folder = DriveApp.createFolder(CONFIG.folderName);
  const spreadsheet = SpreadsheetApp.create(CONFIG.spreadsheetName);
  DriveApp.getFileById(spreadsheet.getId()).moveTo(folder);

  const setupSheet = spreadsheet.getSheets()[0];
  setupSheet.setName("設定・URL");
  const reviewSheet = spreadsheet.insertSheet("教材審査台帳");
  const usageSheet = spreadsheet.insertSheet("利用事例台帳");

  prepareReviewSheet_(reviewSheet);
  prepareUsageSheet_(usageSheet);

  const materialForm = createMaterialForm_();
  const usageForm = createUsageForm_();
  DriveApp.getFileById(materialForm.getId()).moveTo(folder);
  DriveApp.getFileById(usageForm.getId()).moveTo(folder);

  materialForm.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());
  usageForm.setDestination(FormApp.DestinationType.SPREADSHEET, spreadsheet.getId());

  properties.setProperties({
    CINEMED_FOLDER_ID: folder.getId(),
    CINEMED_SPREADSHEET_ID: spreadsheet.getId(),
    CINEMED_MATERIAL_FORM_ID: materialForm.getId(),
    CINEMED_USAGE_FORM_ID: usageForm.getId(),
  });

  ScriptApp.newTrigger("onMaterialSubmit")
    .forForm(materialForm)
    .onFormSubmit()
    .create();
  ScriptApp.newTrigger("onUsageSubmit")
    .forForm(usageForm)
    .onFormSubmit()
    .create();

  writeSetupSheet_(setupSheet, folder, spreadsheet, materialForm, usageForm);
  showCineMedFormUrls();
}

function createMaterialForm_() {
  const form = FormApp.create(CONFIG.materialFormTitle)
    .setDescription(
      "医療者教育用の生成AI動画をご登録ください。登録内容は運営側で確認・再評価し、掲載の可否を判断します。登録しても自動的には公開されません。患者・学習者・医療者を特定できる個人情報を含めないでください。"
    )
    .setConfirmationMessage("ご登録ありがとうございました。運営側で内容を確認し、必要に応じてご連絡します。")
    .setProgressBar(true)
    .setShuffleQuestions(false);

  form.addSectionHeaderItem().setTitle("申請者情報");
  form.addTextItem().setTitle("申請者名").setRequired(true);
  form.addTextItem().setTitle("所属・組織名").setRequired(true);
  addEmailItem_(form, "連絡先メールアドレス", true);
  form.addTextItem().setTitle("サイトに表示する制作者名・組織名").setHelpText("匿名または非表示を希望する場合は、その旨を記載してください。");

  form.addSectionHeaderItem().setTitle("教材情報");
  form.addTextItem().setTitle("日本語タイトル").setRequired(true);
  form.addTextItem().setTitle("英語タイトル");
  form.addMultipleChoiceItem().setTitle("大分類").setChoiceValues(["疾患", "手技", "コンピテンシー", "症候"]).setRequired(true);
  form.addMultipleChoiceItem().setTitle("診察場所").setChoiceValues(["外来", "救急", "病棟", "その他"]).setRequired(true);
  form.addTextItem().setTitle("診療領域・中分類").setHelpText("例：消化器、循環器、医療面接、患者安全").setRequired(true);
  form.addMultipleChoiceItem().setTitle("代表動画の言語").setChoiceValues(["日本語", "English", "日英併記", "その他"]).setRequired(true);
  form.addTextItem().setTitle("キーワード・テーマ").setHelpText("複数ある場合は読点またはカンマで区切ってください。");
  form.addParagraphTextItem().setTitle("教材の概要").setRequired(true);
  form.addParagraphTextItem().setTitle("動画生成に使用したプロンプト").setRequired(true);
  form.addTextItem().setTitle("生成に使用したAI・動画作成ツール").setHelpText("例：LTX Studio、Veo、Sora");

  form.addSectionHeaderItem().setTitle("動画URL");
  addUrlItem_(form, "代表動画URL", true, "Google Driveの場合は、運営が閲覧できる共有設定にしてください。");
  addUrlItem_(form, "対応する別言語版の動画URL", false, "日本語版と英語版がセットの場合に入力してください。");

  form.addSectionHeaderItem().setTitle("権利・安全性の確認");
  addRequiredAgreement_(form, "著作権・利用許諾の確認", "私は、この動画およびプロンプトをCineMed-AIで審査・掲載する権限を有しています。");
  addRequiredAgreement_(form, "個人情報の確認", "患者・学習者・医療者を特定できる個人情報や、掲載許諾のない実在人物の情報は含まれていません。");
  addRequiredAgreement_(form, "審査方針への同意", "登録内容は運営側で再評価され、修正依頼、保留または不掲載となる場合があることに同意します。");
  form.addParagraphTextItem().setTitle("運営への連絡事項");
  return form;
}

function createUsageForm_() {
  const form = FormApp.create(CONFIG.usageFormTitle)
    .setDescription(
      "CineMed-AI掲載動画の利用状況をお知らせください。授業、研修、FD、ワークショップ、自己学習、研究等での活用事例を今後の改善に利用します。"
    )
    .setConfirmationMessage("ご報告ありがとうございました。今後の教材改善と活動報告に活用します。")
    .setProgressBar(true)
    .setShuffleQuestions(false);

  form.addSectionHeaderItem().setTitle("報告者情報");
  form.addTextItem().setTitle("報告者名").setRequired(true);
  form.addTextItem().setTitle("所属・組織名").setRequired(true);
  addEmailItem_(form, "連絡先メールアドレス", true);

  form.addSectionHeaderItem().setTitle("利用した教材");
  form.addTextItem().setTitle("動画IDまたは動画タイトル").setHelpText("不明な場合は、分かる範囲のタイトルを入力してください。").setRequired(true);
  form.addDateItem().setTitle("利用日").setRequired(true);
  form.addCheckboxItem().setTitle("利用形態").setChoiceValues(["授業", "臨床実習", "研修医教育", "FD・教員研修", "ワークショップ", "自己学習", "研究", "その他"]).setRequired(true);
  form.addTextItem().setTitle("対象者").setHelpText("例：医学部3年生、初期研修医、臨床教員").setRequired(true);
  form.addTextItem().setTitle("参加・視聴人数").setValidation(FormApp.createTextValidation().requireNumberGreaterThanOrEqualTo(1).build());
  form.addParagraphTextItem().setTitle("利用目的と利用方法").setRequired(true);
  form.addParagraphTextItem().setTitle("得られた反応・成果・課題");
  form.addMultipleChoiceItem().setTitle("匿名化した利用事例としての紹介可否").setChoiceValues(["紹介可", "事前確認があれば可", "紹介不可"]).setRequired(true);
  form.addParagraphTextItem().setTitle("その他のコメント・改善提案");
  return form;
}

function onMaterialSubmit(e) {
  const values = responseMap_(e.response);
  const spreadsheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("CINEMED_SPREADSHEET_ID"));
  const sheet = spreadsheet.getSheetByName("教材審査台帳");
  const submittedAt = e.response.getTimestamp();
  const submissionId = "SUB-" + Utilities.formatDate(submittedAt, CONFIG.timezone, "yyyyMMdd-HHmmss");
  sheet.appendRow([
    submissionId, submittedAt, "未審査", "", "",
    value_(values, "申請者名"), value_(values, "所属・組織名"), value_(values, "連絡先メールアドレス"),
    value_(values, "サイトに表示する制作者名・組織名"), value_(values, "日本語タイトル"), value_(values, "英語タイトル"),
    value_(values, "大分類"), value_(values, "診察場所"), value_(values, "診療領域・中分類"), value_(values, "代表動画の言語"),
    value_(values, "キーワード・テーマ"), value_(values, "教材の概要"), value_(values, "動画生成に使用したプロンプト"),
    value_(values, "代表動画URL"), value_(values, "対応する別言語版の動画URL"), value_(values, "生成に使用したAI・動画作成ツール"),
    value_(values, "著作権・利用許諾の確認"), value_(values, "個人情報の確認"), value_(values, "審査方針への同意"), value_(values, "運営への連絡事項")
  ]);
}

function onUsageSubmit(e) {
  const values = responseMap_(e.response);
  const spreadsheet = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("CINEMED_SPREADSHEET_ID"));
  spreadsheet.getSheetByName("利用事例台帳").appendRow([
    e.response.getTimestamp(), value_(values, "報告者名"), value_(values, "所属・組織名"), value_(values, "連絡先メールアドレス"),
    value_(values, "動画IDまたは動画タイトル"), value_(values, "利用日"), value_(values, "利用形態"), value_(values, "対象者"),
    value_(values, "参加・視聴人数"), value_(values, "利用目的と利用方法"), value_(values, "得られた反応・成果・課題"),
    value_(values, "匿名化した利用事例としての紹介可否"), value_(values, "その他のコメント・改善提案")
  ]);
}

function showCineMedFormUrls() {
  const p = PropertiesService.getScriptProperties();
  const materialForm = FormApp.openById(p.getProperty("CINEMED_MATERIAL_FORM_ID"));
  const usageForm = FormApp.openById(p.getProperty("CINEMED_USAGE_FORM_ID"));
  const spreadsheet = SpreadsheetApp.openById(p.getProperty("CINEMED_SPREADSHEET_ID"));
  Logger.log("教材登録フォーム（回答用）: " + materialForm.getPublishedUrl());
  Logger.log("利用事例フォーム（回答用）: " + usageForm.getPublishedUrl());
  Logger.log("管理スプレッドシート: " + spreadsheet.getUrl());
}

function prepareReviewSheet_(sheet) {
  setHeaders_(sheet, [
    "受付ID", "受付日時", "審査状態", "運営メモ", "掲載ID", "申請者名", "所属・組織名", "連絡先メールアドレス",
    "表示する制作者名・組織名", "日本語タイトル", "英語タイトル", "大分類", "診察場所", "診療領域・中分類", "代表動画の言語",
    "キーワード・テーマ", "教材の概要", "生成プロンプト", "代表動画URL", "別言語版URL", "生成AI・動画作成ツール",
    "権利確認", "個人情報確認", "審査方針同意", "連絡事項"
  ]);
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(["未審査", "審査中", "採用", "修正依頼", "保留", "不採用"], true).build();
  sheet.getRange("C2:C").setDataValidation(rule);
}

function prepareUsageSheet_(sheet) {
  setHeaders_(sheet, [
    "受付日時", "報告者名", "所属・組織名", "連絡先メールアドレス", "動画ID・タイトル", "利用日", "利用形態", "対象者",
    "参加・視聴人数", "利用目的・方法", "反応・成果・課題", "紹介可否", "コメント・改善提案"
  ]);
}

function writeSetupSheet_(sheet, folder, spreadsheet, materialForm, usageForm) {
  const rows = [
    ["項目", "URL・ID", "用途"],
    ["保存フォルダ", folder.getUrl(), "フォームと回答スプレッドシートの保存先"],
    ["管理スプレッドシート", spreadsheet.getUrl(), "審査・利用事例管理"],
    ["教材登録フォーム（回答用）", materialForm.getPublishedUrl(), "サイト管理画面の「教材登録フォームURL」に設定"],
    ["教材登録フォーム（編集用）", materialForm.getEditUrl(), "設問の修正"],
    ["利用事例フォーム（回答用）", usageForm.getPublishedUrl(), "サイト管理画面の「利用事例フォームURL」に設定"],
    ["利用事例フォーム（編集用）", usageForm.getEditUrl(), "設問の修正"],
  ];
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#d9ead3");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, 3);
}

function setHeaders_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#d9ead3");
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, sheet.getMaxRows(), headers.length).createFilter();
  sheet.autoResizeColumns(1, headers.length);
}

function addEmailItem_(form, title, required) {
  return form.addTextItem()
    .setTitle(title)
    .setRequired(required)
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
}

function addUrlItem_(form, title, required, helpText) {
  return form.addTextItem()
    .setTitle(title)
    .setHelpText(helpText)
    .setRequired(required)
    .setValidation(FormApp.createTextValidation().requireTextIsUrl().build());
}

function addRequiredAgreement_(form, title, choice) {
  return form.addCheckboxItem()
    .setTitle(title)
    .setChoiceValues([choice])
    .setRequired(true);
}

function responseMap_(response) {
  return response.getItemResponses().reduce(function (map, itemResponse) {
    map[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
    return map;
  }, {});
}

function value_(map, key) {
  const value = map[key];
  return Array.isArray(value) ? value.join("、") : (value == null ? "" : value);
}
