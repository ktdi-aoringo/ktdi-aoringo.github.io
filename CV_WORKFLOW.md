# CV生成マニュアル

このプロジェクトでは、CVの内容を `data/cv.mjs` にまとめて管理し、そこから英語版・日本語版のHTML/PDFを生成します。

## ファイル構成

- `data/cv.mjs`: CVのデータ本体です。学歴、経済的支援、資格、研究分野、論文、発表、受賞、講演などをここで編集します。
- `scripts/build-cv.mjs`: `data/cv.mjs` から英語版・日本語版のCV用HTML/PDFを生成するスクリプトです。
- `dist/cv-en.html`: 生成された英語HTML版CVです。
- `dist/cv-en.pdf`: 生成された英語PDF版CVです。
- `dist/cv-ja.html`: 生成された日本語HTML版CVです。
- `dist/cv-ja.pdf`: 生成された日本語PDF版CVです。
- `dist/cv.html`: 日本語HTML版CVのエイリアスです。
- `dist/cv.pdf`: 日本語PDF版CVのエイリアスです。
- `package.json`: `npm run build:cv` コマンドを定義しています。

## 基本的な使い方

1. `data/cv.mjs` を開く。
2. 追加・修正したい項目を編集する。
3. ターミナルで次を実行する。

```sh
npm run build:cv
```

4. 生成された `dist/cv-en.pdf` と `dist/cv-ja.pdf` を確認する。

## よく編集する場所

### 最終更新日

```js
lastUpdated: "2026/5/30",
```

### 氏名

```js
profile: {
  nameJa: "北代絢大",
  nameEn: "Ayato Kitadai",
  titleEn: "Curriculum Vitae",
  titleJa: "Curriculum Vitae"
},
```

CVのヘッダーには、所属・ホームページURLは表示しません。

### 業績の追加

各セクションの `entries` に文字列を1行追加します。英語版・日本語版で表示内容を変えたい場合は、`en` と `ja` を持つオブジェクトにします。

```js
{
  titleEn: "Working Papers",
  titleJa: "ワーキングペーパー",
  entries: [
    "A. Kitadai, ...; “Paper Title,” arXiv:xxxx.xxxxx, 2026.",
    {
      en: "A. Kitadai; “English Title,” Conference Name, 2026.",
      ja: "北代絢大：「日本語タイトル」会議名, 2026年."
    }
  ]
}
```

## 書式のメモ

- `A. Kitadai`, `Ayato Kitadai`, `北代絢大` は生成時に自動で太字になります。
- 雑誌名・会議名などをイタリックにしたい場合は `<em>...</em>` を使えます。
- 業績データでは `<em>...</em>` のみ書式用HTMLとして使う想定です。
- PDFはA4サイズで出力されます。

## 生成物

コマンド実行後、以下が更新されます。

- 英語HTML: `dist/cv-en.html`
- 英語PDF: `dist/cv-en.pdf`
- 日本語HTML: `dist/cv-ja.html`
- 日本語PDF: `dist/cv-ja.pdf`
- 日本語版エイリアス: `dist/cv.html`, `dist/cv.pdf`

HTML版はブラウザで表示確認できます。PDF版は提出・共有用です。

## 必要な環境

- Node.js
- npm
- Google Chrome または Chromium

PDF生成にはローカルのChrome/Chromiumのヘッドレス印刷機能を使います。

## うまくPDFが生成されない場合

まず次を確認してください。

```sh
npm run build:cv
```

このコマンドでHTMLは生成されるがPDFが生成されない場合、Chrome/Chromiumが見つかっていない可能性があります。

macOSでGoogle Chromeを通常の場所にインストールしている場合は、そのまま動く想定です。

## 運用方針

- CVの元データは `data/cv.mjs` に集約します。
- 手作業で `dist/` 以下の生成ファイルを直接編集しません。
- 業績を追加したら、最後に必ず `npm run build:cv` を実行します。
