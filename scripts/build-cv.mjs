import { execFile } from "node:child_process";
import { copyFile, mkdir, unlink, writeFile } from "node:fs/promises";
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

const labels = {
  en: {
    htmlLang: "en",
    suffix: "en",
    updated: "Last updated",
    education: "Education",
    support: "Fellowships and Support",
    qualifications: "Qualifications",
    fields: "Research Areas",
    name: cv.profile.nameEn,
    title: cv.profile.titleEn
  },
  ja: {
    htmlLang: "ja",
    suffix: "ja",
    updated: "最終更新",
    education: "学歴",
    support: "経済的支援等",
    qualifications: "資格",
    fields: "研究分野",
    name: `${cv.profile.nameJa} (${cv.profile.nameEn})`,
    title: cv.profile.titleJa
  }
};

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const pick = (value, lang) => {
  if (typeof value === "string") return value;
  return value[lang] ?? value.en ?? value.ja ?? "";
};

const highlightName = (html) =>
  html
    .replaceAll("A. Kitadai", "<strong>A. Kitadai</strong>")
    .replaceAll("Ayato Kitadai", "<strong>Ayato Kitadai</strong>")
    .replaceAll("北代絢大", "<strong>北代絢大</strong>");

const formatEntry = (entry, lang) =>
  highlightName(
    escapeHtml(pick(entry, lang))
      .replaceAll("&lt;em&gt;", "<em>")
      .replaceAll("&lt;/em&gt;", "</em>")
  );

const renderList = (items, lang) =>
  `<ul>${items.map((item) => `<li>${formatEntry(item, lang)}</li>`).join("\n")}</ul>`;

const compactList = (title, items, lang) => `
  <section class="meta-section">
    <h2>${escapeHtml(title)}</h2>
    ${renderList(items, lang)}
  </section>`;

const renderHtml = (lang) => {
  const t = labels[lang];

  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(t.title)} - ${escapeHtml(t.name)}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 16mm;
    }

    :root {
      color: #1b1b1f;
      background: #ffffff;
      font-family: "Hiragino Sans", "Yu Gothic", "YuGothic", "Noto Sans JP", Arial, sans-serif;
      font-size: 10.2pt;
      line-height: 1.52;
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
      font-size: 24pt;
      font-weight: 500;
      line-height: 1.05;
      margin: 0 0 3mm;
      letter-spacing: 0;
    }

    .name {
      font-size: 13pt;
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

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      column-gap: 9mm;
      row-gap: 3mm;
      margin-bottom: 4mm;
    }

    section {
      break-inside: avoid;
      margin: 0 0 5mm;
    }

    .works-section {
      break-inside: auto;
    }

    h2 {
      border-bottom: 0.6px solid #b9bbc1;
      font-size: 11pt;
      margin: 0 0 2mm;
      padding-bottom: 0.8mm;
      letter-spacing: 0;
    }

    ul,
    ol {
      margin: 0;
      padding-left: 5.2mm;
    }

    li {
      margin: 0 0 1.45mm;
      padding-left: 0.6mm;
    }

    ol li::marker {
      font-size: 8.5pt;
      color: #5f636d;
    }

    strong {
      font-weight: 700;
    }

    em {
      font-style: italic;
    }

    .keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 1.2mm 2.4mm;
      padding: 0;
      list-style: none;
    }

    .keywords li {
      margin: 0;
      padding: 0;
    }

    .section-count {
      color: #6c707a;
      font-weight: 400;
      margin-left: 2mm;
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
        <h1>${escapeHtml(t.title)}</h1>
        <p class="name">${escapeHtml(t.name)}</p>
      </div>
      <p class="updated">${escapeHtml(t.updated)}: ${escapeHtml(cv.lastUpdated)}</p>
    </header>

    <div class="meta-grid">
      ${compactList(t.education, cv.education, lang)}
      ${compactList(t.support, cv.support, lang)}
      ${compactList(t.qualifications, cv.qualifications, lang)}
      <section class="meta-section">
        <h2>${escapeHtml(t.fields)}</h2>
        <ul class="keywords">${cv.fields.map((field) => `<li>${escapeHtml(pick(field, lang))}</li>`).join("\n")}</ul>
      </section>
    </div>

    ${cv.sections.map((section) => `
      <section class="works-section">
        <h2>${escapeHtml(section[`title${lang === "en" ? "En" : "Ja"}`])} <span class="section-count">(${section.entries.length})</span></h2>
        <ol>
          ${section.entries.map((entry) => `<li>${formatEntry(entry, lang)}</li>`).join("\n")}
        </ol>
      </section>
    `).join("\n")}
  </main>
</body>
</html>`;
};

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
      `--user-data-dir=${resolve("/private/tmp", "kitadai-cv-chrome-profile")}`,
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

for (const lang of ["en", "ja"]) {
  const suffix = labels[lang].suffix;
  const htmlPath = resolve(outDir, `cv-${suffix}.html`);
  const pdfPath = resolve(outDir, `cv-${suffix}.pdf`);

  await writeFile(htmlPath, renderHtml(lang));
  await printPdf(htmlPath, pdfPath);
  console.log(`Created ${htmlPath}`);
  if (existsSync(pdfPath)) console.log(`Created ${pdfPath}`);
}

await copyFile(resolve(outDir, "cv-ja.html"), resolve(outDir, "cv.html"));
if (existsSync(resolve(outDir, "cv-ja.pdf"))) {
  await copyFile(resolve(outDir, "cv-ja.pdf"), resolve(outDir, "cv.pdf"));
}

console.log(`Created ${resolve(outDir, "cv.html")} (Japanese alias)`);
if (existsSync(resolve(outDir, "cv.pdf"))) {
  console.log(`Created ${resolve(outDir, "cv.pdf")} (Japanese alias)`);
}
