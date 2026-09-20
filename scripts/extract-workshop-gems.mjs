import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/extract-workshop-gems.mjs /path/to/gemini_gems_data.html");
  process.exit(1);
}

const html = fs.readFileSync(path.resolve(input), "utf8");
const outputDir = path.join(root, "source", "workshop-gems");
const targets = [
  ["Workshop Designer", "workshop-designer"],
  ["Prompt Coach", "prompt-coach"],
  ["Prompt Reviewer", "prompt-reviewer"],
  ["Medical Checker", "medical-checker"],
  ["Ethics &amp; Safety Checker", "ethics-safety-checker"],
  ["Troubleshooter", "troubleshooter"],
];

function decode(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

fs.mkdirSync(outputDir, { recursive: true });
const manifest = [];

for (const [encodedName, slug] of targets) {
  const pattern = new RegExp(
    `<b>名前:</b>\\s*${escapeRegex(encodedName)}\\s*<br><b>カスタム指示:</b>([\\s\\S]*?)<br><b>ファイル数:</b>([\\s\\S]*?)(?=<br><br><br><b>名前:</b>|</div>|$)`,
  );
  const match = html.match(pattern);
  if (!match) throw new Error(`Gem not found: ${decode(encodedName)}`);

  const prompt = decode(match[1])
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  const sources = [...match[2].matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/g)].map((source) => ({
    title: decode(source[2]).replace(/<[^>]+>/g, "").trim(),
    url: decode(source[1]),
  }));

  const promptPath = path.join(outputDir, `${slug}.md`);
  fs.writeFileSync(promptPath, `${prompt}\n`, "utf8");
  manifest.push({ name: decode(encodedName), slug, prompt: `${slug}.md`, sources });
}

fs.writeFileSync(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Extracted ${manifest.length} Gems to ${path.relative(root, outputDir)}`);
