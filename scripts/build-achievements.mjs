import { execFile } from "node:child_process";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import cv from "../data/cv.mjs";

const root = resolve(import.meta.dirname, "..");
const outDir = resolve(root, "dist");

const chromeCandidates = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/opt/homebrew/bin/chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium"
];

const chrome = chromeCandidates.find((candidate) => existsSync(candidate));

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const pick = (value, lang = "ja") => {
  if (typeof value === "string") return value;
  return value[lang] ?? value.en ?? value.ja ?? "";
};

const highlightName = (html) =>
  html
    .replaceAll("A. Kitadai", "<strong>A. Kitadai</strong>")
    .replaceAll("Ayato Kitadai", "<strong>Ayato Kitadai</strong>")
    .replaceAll("北代絢大", "<strong>北代絢大</strong>");

const formatEntry = (entry) =>
  highlightName(
    escapeHtml(pick(entry))
      .replaceAll("&lt;em&gt;", "<em>")
      .replaceAll("&lt;/em&gt;", "</em>")
  );

const findSection = (titleEn) => cv.sections.find((section) => section.titleEn === titleEn);

const peerReviewed = findSection("Peer-Reviewed Publications").entries;
const workingPapers = findSection("Working Papers").entries;
const internationalPresentations = findSection("Conference Presentations (International, Oral, Peer-Reviewed)").entries;
const domesticPresentations = findSection("Conference Presentations (Domestic, Oral)").entries;
const awards = findSection("Awards").entries;
const talks = findSection("Talks and Other Activities").entries;

const journalPapers = peerReviewed.filter((entry) => pick(entry, "en").includes("Group Decision and Negotiation"));
const internationalConferencePapers = peerReviewed.filter((entry) => !journalPapers.includes(entry));
const reviewsAndCommentaries = talks.filter((entry) => pick(entry, "ja").includes("経済セミナー"));
const talksWithoutCommentaries = talks.filter((entry) => !reviewsAndCommentaries.includes(entry));

const titleOf = (entry) => {
  const match = pick(entry, "en").match(/[“"](.+?)[”"]/);
  return match?.[1] ?? pick(entry, "en");
};

const normalizedTitle = (title) =>
  title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "");

const internationalConferencePaperTitles = new Set(
  internationalConferencePapers.map((entry) => normalizedTitle(titleOf(entry)))
);

// A proceedings paper is listed under section 2 only; its corresponding
// conference presentation is not repeated under section 5.1.
const internationalPresentationsWithoutProceedings = internationalPresentations.filter(
  (entry) => !internationalConferencePaperTitles.has(normalizedTitle(titleOf(entry)))
);

const renderOrderedList = (items) => {
  if (items.length === 0) {
    return '<p class="none">該当なし</p>';
  }

  return `<ol>
    ${items.map((item) => `<li>${formatEntry(item)}</li>`).join("\n")}
  </ol>`;
};

const renderSection = (title, items) => `
  <section>
    <h2>${escapeHtml(title)} <span class="count">(${items.length})</span></h2>
    ${renderOrderedList(items)}
  </section>`;

const renderNestedSection = (title, groups) => `
  <section>
    <h2>${escapeHtml(title)} <span class="count">(${groups.reduce((sum, group) => sum + group.items.length, 0)})</span></h2>
    ${groups.map((group) => `
      <div class="subsection">
        <h3>${escapeHtml(group.title)} <span class="count">(${group.items.length})</span></h3>
        ${renderOrderedList(group.items)}
      </div>
    `).join("\n")}
  </section>`;

const renderHtml = () => `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>研究業績リスト - ${escapeHtml(cv.profile.nameJa)}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 16mm 15mm 19mm;
    }

    :root {
      color: #1b1b1f;
      background: #ffffff;
      font-family: "Hiragino Sans", "Yu Gothic", "YuGothic", "Noto Sans JP", Arial, sans-serif;
      font-size: 10.1pt;
      line-height: 1.5;
    }

    body {
      margin: 0;
      background: #ffffff;
      color: #1b1b1f;
    }

    .page {
      max-width: 182mm;
      margin: 0 auto;
    }

    header {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10mm;
      align-items: end;
      border-bottom: 1.5px solid #1b1b1f;
      padding-bottom: 4mm;
      margin-bottom: 6mm;
    }

    h1 {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 22pt;
      font-weight: 500;
      line-height: 1.05;
      margin: 0 0 3mm;
      letter-spacing: 0;
    }

    .name {
      font-size: 12.5pt;
      font-weight: 700;
      margin: 0;
    }

    .updated {
      color: #4d4d55;
      font-size: 9pt;
      margin: 0;
      text-align: right;
      white-space: nowrap;
    }

    section {
      break-inside: auto;
      margin: 0 0 5mm;
    }

    h2 {
      border-bottom: 0.6px solid #b9bbc1;
      font-size: 11.2pt;
      margin: 0 0 2mm;
      padding-bottom: 0.8mm;
      letter-spacing: 0;
    }

    h3 {
      font-size: 10.3pt;
      margin: 3mm 0 1.5mm;
    }

    ol {
      margin: 0;
      padding-left: 6.8mm;
    }

    li {
      margin: 0 0 1.45mm;
      padding-left: 0.6mm;
    }

    li::marker {
      font-size: 8.5pt;
      color: #5f636d;
    }

    strong {
      font-weight: 700;
    }

    em {
      font-style: italic;
    }

    .count {
      color: #6c707a;
      font-weight: 400;
      margin-left: 1.5mm;
    }

    .none {
      color: #4d4d55;
      margin: 0;
    }

    @media screen {
      body {
        background: #eff1f5;
        padding: 18px;
      }

      .page {
        background: #ffffff;
        box-shadow: 0 18px 50px rgb(21 25 35 / 14%);
        padding: 15mm 16mm;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <header>
      <div>
        <h1>研究業績リスト</h1>
        <p class="name">${escapeHtml(cv.profile.nameJa)} (${escapeHtml(cv.profile.nameEn)})</p>
      </div>
      <p class="updated">最終更新: ${escapeHtml(cv.lastUpdated)}</p>
    </header>

    ${renderSection("1. 学術雑誌論文（査読付）", journalPapers)}
    ${renderSection("2. 国際会議論文（査読付）", internationalConferencePapers)}
    ${renderSection("3. 著書", [])}
    ${renderSection("4. 総説および解説", reviewsAndCommentaries)}
    ${renderNestedSection("5. 学術講演・研究発表", [
      { title: "5.1 国際会議発表", items: internationalPresentationsWithoutProceedings },
      { title: "5.2 国内会議発表", items: domesticPresentations },
      { title: "5.3 招待講演・セミナー等", items: talksWithoutCommentaries }
    ])}
    ${renderSection("6. 特許", [])}
    ${renderSection("7. 外部資金獲得状況", cv.grants)}
    ${renderSection("8. ワーキングペーパー", workingPapers)}
    ${renderSection("9. 受賞", awards)}
  </main>
</body>
</html>`;

const printPdf = async (htmlPath, pdfPath) => {
  await unlink(pdfPath).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });

  if (!chrome) {
    console.log(`Chrome/Chromium was not found, so PDF export was skipped for ${htmlPath}.`);
    return;
  }

  const inputUrl = pathToFileURL(htmlPath).href;

  await new Promise((resolvePromise, reject) => {
    execFile(chrome, [
      "--headless=new",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-gpu",
      "--disable-sync",
      "--metrics-recording-only",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${resolve("/private/tmp", "kitadai-achievements-chrome-profile")}`,
      "--no-pdf-header-footer",
      "--print-to-pdf-no-header",
      `--print-to-pdf=${pdfPath}`,
      inputUrl
    ], { timeout: 45000 }, (error, stdout, stderr) => {
      if (error) {
        if (existsSync(pdfPath)) {
          resolvePromise();
          return;
        }
        error.message += `\n${stderr}`;
        reject(error);
        return;
      }
      if (stdout.trim()) console.log(stdout.trim());
      if (stderr.trim()) console.error(stderr.trim());
      resolvePromise();
    });
  });
};

await mkdir(outDir, { recursive: true });

const htmlPath = resolve(outDir, "research_achievements_Kitadai_202607.html");
const pdfPath = resolve(outDir, "research_achievements_Kitadai_202607.pdf");

await writeFile(htmlPath, renderHtml());
await printPdf(htmlPath, pdfPath);

console.log(`Created ${htmlPath}`);
if (existsSync(pdfPath)) console.log(`Created ${pdfPath}`);
