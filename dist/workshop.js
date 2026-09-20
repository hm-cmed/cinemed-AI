const toolDefinitions = {
  "workshop-designer": {
    order: 1,
    stage: "PLAN｜Workshop Designer",
    title: "ワークショップを設計する",
    summary: "対象者・時間・環境から、教育目標に沿ったワークショップ全体を設計します。",
    useWhen: "開催構成、タイムテーブル、代替案までまとめたい時",
    gemUrl: "https://gemini.google.com/gem/1Gfk8p-V-KWhb07Qn7kiKGeKZWH-1A3Fi?usp=sharing",
    fields: [
      ["audience", "誰を対象にしますか？", "例：臨床実習指導医、看護教員、多職種", true],
      ["participants", "参加人数は？", "例：30名", true, "input"],
      ["duration", "利用可能な時間は？", "例：90分、3時間", true, "input"],
      ["experience", "参加者の生成AI経験は？", "初心者中心／混在／経験者中心", true, "input"],
      ["goal", "何をできるようになってほしいですか？", "例：教育用動画を1本作り、安全性を評価できる", true],
      ["format", "開催形式は？", "対面／オンライン／ハイブリッド", true, "input"],
      ["environment", "使用予定AI・契約・端末・Wi-Fi・予算", "分かる範囲でまとめてください。"],
      ["domain", "医療領域・事前学習の可否", "任意入力"]
    ]
  },
  "prompt-coach": {
    order: 2,
    stage: "CREATE｜Prompt Coach",
    title: "教育動画のPromptを作る",
    summary: "教育目標から逆算して、学習者に見せたい行動と医学的条件を動画生成Promptに落とし込みます。",
    useWhen: "教育用動画のPromptを最初から組み立てたい時",
    gemUrl: "https://gemini.google.com/gem/1GXA-LtWnQ-LwORkY8G3Iu-OpTR3R2xlR?usp=sharing",
    fields: [
      ["audience", "誰が見る動画ですか？", "医学生、研修医、指導医、看護師、多職種など", true, "input"],
      ["goal", "何を学んでほしいですか？", "学習目標を記載してください。", true],
      ["setting", "どのような場面ですか？", "救急外来、病棟、診察室、分娩室など", true, "input"],
      ["mustShow", "何を必ず映したいですか？", "症状、行動、手技、コミュニケーションなど", true],
      ["ai", "使用予定の動画生成AIは？", "Veo、Grok、Kling、未定など", true, "input"],
      ["details", "その他の希望", "動画時間、会話、患者属性、カメラ、Good / Bad example、字幕、音声など"]
    ]
  },
  "prompt-reviewer": {
    order: 3,
    stage: "IMPROVE｜Prompt Reviewer",
    title: "生成結果からPromptを改善する",
    summary: "生成上の問題を分類し、モデルの限界とPromptの問題を切り分けて、最小限の修正版を作ります。",
    useWhen: "人物・動作・左右・会話・一貫性などが崩れた時",
    gemUrl: "https://gemini.google.com/gem/1OVSApOck3M_-QJx-dexZjw1OIRAwBWtX?usp=sharing",
    fields: [
      ["original", "元のPrompt", "使用したPromptを貼り付けてください。", true],
      ["ai", "使用したAI", "Veo / Sora / Kling / LTX / Grok / その他", true, "input"],
      ["desired", "本来作りたかった動画", "意図した場面と学習上の目的を説明してください。", true],
      ["problem", "実際に起きた問題", "例：患者の服が変わる、医師が別人になる、左右が逆になる", true],
      ["evidence", "動画・スクリーンショットの補足", "この静的ページでは添付できません。コピー先のAIに添付する資料の内容や時刻を記載してください。"]
    ]
  },
  "medical-checker": {
    order: 4,
    stage: "CHECK｜Medical Checker",
    title: "医学的な問題がないか確認する",
    summary: "症状、診察、手技、機器、行動、時系列などを教育目標との関係から確認します。",
    useWhen: "生成動画を教材として使う前に医学的妥当性を点検したい時",
    gemUrl: "https://gemini.google.com/gem/1kUCzizHemt-E5dhL40wAC18zDj6Fxh18?usp=sharing",
    fields: [
      ["purpose", "動画の教育目的", "例：医学生に心停止前の状態悪化を認識させる", true],
      ["audience", "対象学習者", "例：医学科4年生", true, "input"],
      ["focus", "何を見てほしい動画ですか？", "例：患者の呼吸状態、意識変化、周囲の初期対応", true],
      ["media", "動画・スクリーンショットの補足", "コピー先のAIへ添付する動画の時刻や場面を記載してください。"],
      ["intentionalError", "意図的な誤りはありますか？", "なし／あり（ある場合は内容）", true, "input"],
      ["question", "特に確認したい点", "例：胸骨圧迫の位置は正しいか"]
    ]
  },
  "ethics-safety-checker": {
    order: 5,
    stage: "RELEASE｜Ethics & Safety Checker",
    title: "授業利用・公開前に安全性を確認する",
    summary: "個人情報、権利、AI表示、バイアス、公開範囲、Creative Commonsなどを確認します。",
    useWhen: "授業利用、Web公開、共有の可否を検討する時",
    gemUrl: "https://gemini.google.com/gem/1PSvhN6lOXQpF2oblqgZS5D59CHay0HdL?usp=sharing",
    fields: [
      ["use", "何に使いますか？", "授業 / 研修 / 学会 / Web / SNS / その他", true, "input"],
      ["audience", "誰が見ますか？", "学習者限定 / 学内 / 会員限定 / 一般公開", true, "input"],
      ["publication", "公開予定はありますか？", "なし / 限定公開 / 一般公開 / Creative Commons", true, "input"],
      ["ai", "使用したAI", "例：Gemini / Veo / Sora", true, "input"],
      ["account", "使用アカウント", "個人アカウント / 所属機関アカウント / 不明", true, "input"],
      ["materials", "AIへ入力した素材", "文章、画像、動画、実症例資料など", true],
      ["rights", "実在人物・患者情報／第三者素材", "それぞれ、なし / あり / 不明を記載してください。", true],
      ["question", "確認してほしいこと", "自由記載"]
    ]
  },
  "troubleshooter": {
    order: 6,
    stage: "HELP｜Troubleshooter",
    title: "ワークショップ中の問題に対応する",
    summary: "学習を止めないことを優先し、簡略化・グループ生成・事前素材などの代替策を提案します。",
    useWhen: "Wi-Fi、生成時間、クレジット、ログイン、品質の問題が起きた時",
    gemUrl: "https://gemini.google.com/gem/1WpJIRKOYQWek-6LDEuM6PexJE7OK9b9b?usp=sharing",
    fields: [
      ["issue", "今、何が起きていますか？", "自由記載", true],
      ["during", "Workshop中ですか？", "はい / いいえ", true, "input"],
      ["participants", "参加人数", "例：30名", false, "input"],
      ["ai", "使用しているAI", "例：Veo", false, "input"],
      ["blocked", "止まっている作業", "例：全員が動画生成できない", true],
      ["fallback", "代替素材", "事前生成動画あり / なし / 不明", false, "input"]
    ]
  }
};

const cards = document.querySelector("#tool-cards");
const builder = document.querySelector("#builder");
const fieldsContainer = document.querySelector("#tool-fields");
const output = document.querySelector("#request-output");
const systemPrompt = document.querySelector("#system-prompt");
const sourceList = document.querySelector("#source-list");
let manifest = [];
let active = null;
let activePrompt = "";

function fieldMarkup([id, label, placeholder, required = false, kind = "textarea"]) {
  const control = kind === "input"
    ? `<input id="field-${id}" name="${id}" placeholder="${placeholder}" ${required ? "required" : ""}>`
    : `<textarea id="field-${id}" name="${id}" placeholder="${placeholder}" ${required ? "required" : ""}></textarea>`;
  return `<label class="field-label" for="field-${id}"><span>${label}${required ? ' <span class="required-mark">必須</span>' : ""}</span>${control}</label>`;
}

function renderCards() {
  const tools = Object.entries(toolDefinitions).sort((a, b) => a[1].order - b[1].order);
  cards.innerHTML = tools.map(([slug, tool]) => `<button class="workshop-card" type="button" data-tool="${slug}">
    <span class="step"><span>${tool.stage}</span><b>${tool.order}</b></span>
    <h3>${tool.title}</h3><p>${tool.summary}</p><span class="card-use">${tool.useWhen}</span>
    <span class="select-label">入力を始める →</span>
  </button>`).join("");
}

function buildRequest() {
  if (!active) return;
  const tool = toolDefinitions[active.slug];
  const values = tool.fields.map(([id, label]) => {
    const value = document.querySelector(`#field-${id}`).value.trim();
    return `【${label}】\n${value || "未入力（必要であれば確認質問をしてください）"}`;
  });
  output.textContent = `# 依頼\n${tool.title}を支援してください。情報が不足している場合は、推測せず重要な確認質問を優先してください。\n\n${values.join("\n\n")}`;
  const required = tool.fields.filter(([, , , isRequired]) => isRequired);
  const completed = required.filter(([id]) => document.querySelector(`#field-${id}`).value.trim()).length;
  document.querySelector("#completion-status").textContent = `必須 ${completed}/${required.length}`;
}

function sourceText() {
  return active.sources.length
    ? active.sources.map((source) => `- ${source.title}: ${source.url}`).join("\n")
    : "- なし";
}

function packageText() {
  return `# CineMed-AI Workshop Tool\n${active.name}\n\n# System Instructions\n${activePrompt}\n\n# Reference materials registered in the original Gem\n以下の資料はこのテキストには添付されていません。必要な場合は、利用権限を確認したうえで別途参照または添付してください。\n${sourceText()}\n\n${output.textContent}`;
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = text;
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  const previous = button.textContent;
  button.textContent = "コピーしました";
  setTimeout(() => { button.textContent = previous; }, 1500);
}

function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function selectTool(slug) {
  active = manifest.find((item) => item.slug === slug);
  const tool = toolDefinitions[slug];
  if (!active || !tool) return;
  document.querySelector("#builder-stage").textContent = tool.stage;
  document.querySelector("#builder-title").textContent = tool.title;
  document.querySelector("#builder-description").textContent = tool.summary;
  document.querySelector("#legacy-gem").href = tool.gemUrl;
  fieldsContainer.innerHTML = tool.fields.map(fieldMarkup).join("");
  fieldsContainer.querySelectorAll("input,textarea").forEach((control) => control.addEventListener("input", buildRequest));
  sourceList.innerHTML = active.sources.map((source) => `<li><a href="${source.url}" target="_blank" rel="noopener">${source.title} ↗</a></li>`).join("");
  const promptUrl = `prompts/${active.prompt}`;
  document.querySelector("#download-system").href = promptUrl;
  systemPrompt.textContent = "読み込み中…";
  try {
    const response = await fetch(promptUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    activePrompt = await response.text();
    systemPrompt.textContent = activePrompt;
  } catch {
    activePrompt = "";
    systemPrompt.textContent = "システムプロンプトを読み込めませんでした。ページを再読み込みしてください。";
  }
  builder.hidden = false;
  buildRequest();
  builder.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function initialize() {
  renderCards();
  try {
    const response = await fetch("prompts/manifest.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    manifest = await response.json();
  } catch {
    cards.insertAdjacentHTML("beforebegin", '<p class="prototype-note">ツール情報を読み込めませんでした。ページを再読み込みしてください。</p>');
  }
}

cards.addEventListener("click", (event) => {
  const card = event.target.closest("[data-tool]");
  if (card) selectTool(card.dataset.tool);
});
document.querySelector("#change-tool").addEventListener("click", () => document.querySelector("#workflow").scrollIntoView({ behavior: "smooth" }));
document.querySelector("#copy-request").addEventListener("click", (event) => copyText(output.textContent, event.currentTarget));
document.querySelector("#copy-package").addEventListener("click", (event) => copyText(packageText(), event.currentTarget));
document.querySelector("#copy-system").addEventListener("click", (event) => copyText(activePrompt, event.currentTarget));
document.querySelector("#download-package").addEventListener("click", () => downloadText(`${active.slug}-package.txt`, packageText()));
initialize();
