#!/usr/bin/env python3
"""Promote preview/ to site root for GitHub Pages."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "preview"
BASE = "https://ktdi-aoringo.github.io"

COPY = [
    ("index.html", "index.html"),
    ("index-ja.html", "index-ja.html"),
    ("research.html", "research.html"),
    ("research-ja.html", "research-ja.html"),
    ("styles.css", "styles.css"),
    ("script.js", "script.js"),
]

REDIRECTS = {
    "index-en.html": "index.html",
    "cv.html": "research-ja.html",
    "cv-en.html": "research.html",
}

SEO = {
    "index.html": {
        "lang": "en",
        "title": "Ayato Kitadai",
        "description": "PhD student at the University of Tokyo. Game theory, market design, experimental economics, and large language models.",
        "canonical": f"{BASE}/",
        "hreflang": [("ja", f"{BASE}/index-ja.html"), ("en", f"{BASE}/"), ("x-default", f"{BASE}/")],
        "og_locale": "en_US",
        "og_alt": "ja_JP",
    },
    "index-ja.html": {
        "lang": "ja",
        "title": "北代 絢大",
        "description": "東京大学大学院 工学系研究科 技術経営戦略学専攻。ゲーム理論、マーケットデザイン、実験経済学、大規模言語モデル。",
        "canonical": f"{BASE}/index-ja.html",
        "hreflang": [("ja", f"{BASE}/index-ja.html"), ("en", f"{BASE}/"), ("x-default", f"{BASE}/")],
        "og_locale": "ja_JP",
        "og_alt": "en_US",
    },
    "research.html": {
        "lang": "en",
        "title": "Research — Ayato Kitadai",
        "description": "Publications, presentations, awards, and talks by Ayato Kitadai.",
        "canonical": f"{BASE}/research.html",
        "hreflang": [
            ("ja", f"{BASE}/research-ja.html"),
            ("en", f"{BASE}/research.html"),
            ("x-default", f"{BASE}/research.html"),
        ],
        "og_locale": "en_US",
        "og_alt": "ja_JP",
    },
    "research-ja.html": {
        "lang": "ja",
        "title": "研究業績 — 北代 絢大",
        "description": "北代絢大の論文・発表・受賞・講演一覧。",
        "canonical": f"{BASE}/research-ja.html",
        "hreflang": [
            ("ja", f"{BASE}/research-ja.html"),
            ("en", f"{BASE}/research.html"),
            ("x-default", f"{BASE}/research.html"),
        ],
        "og_locale": "ja_JP",
        "og_alt": "en_US",
    },
}


def strip_preview(html: str) -> str:
    html = re.sub(r'\s*<meta name="robots" content="noindex, nofollow">\n', "", html)
    html = re.sub(r"\n\s*<div class=\"preview-banner\">.*?</div>\n", "\n", html, flags=re.S)
    html = html.replace(" · Preview</p>", "</p>")
    return html


def inject_seo(html: str, name: str) -> str:
    meta = SEO[name]
    author = "北代 絢大" if meta["lang"] == "ja" else "Ayato Kitadai"
    block = f"""    <title>{meta['title']}</title>
    <meta name="description" content="{meta['description']}">
    <meta name="author" content="{author}">
    <link rel="canonical" href="{meta['canonical']}">
"""
    for lang, href in meta["hreflang"]:
        block += f'    <link rel="alternate" hreflang="{lang}" href="{href}">\n'
    block += f"""    <meta property="og:title" content="{meta['title']}">
    <meta property="og:description" content="{meta['description']}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{meta['canonical']}">
    <meta property="og:locale" content="{meta['og_locale']}">
    <meta property="og:locale:alternate" content="{meta['og_alt']}">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{meta['title']}">
    <meta name="twitter:description" content="{meta['description']}">

"""
    html = re.sub(r"\s*<title>[^<]*</title>\s*", "\n", html)
    html = re.sub(r'\s*<meta name="description"[\s\S]*?>\s*', "\n", html, flags=re.I)
    html = re.sub(r'\s*<meta name="author" content="[^"]*">\s*', "\n", html, flags=re.I)
    html = re.sub(
        r'(<meta name="viewport" content="width=device-width, initial-scale=1\.0">)',
        r"\1\n" + block,
        html,
        count=1,
    )
    html = re.sub(r'<html lang="[^"]*">', f'<html lang="{meta["lang"]}">', html, count=1)
    return html


def redirect_html(target: str, lang: str = "en") -> str:
    label = "Continue" if lang == "en" else "移動する"
    return f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="refresh" content="0; url={target}">
    <link rel="canonical" href="{BASE}/{target}">
    <title>Redirecting…</title>
    <script>location.replace("{target}");</script>
</head>
<body>
    <p><a href="{target}">{label}</a></p>
</body>
</html>
"""


def write_sitemap() -> None:
    today = "2026-05-19"
    pages = [
        ("/", "index.html", "index-ja.html"),
        ("/index-ja.html", "index-ja.html", "index.html"),
        ("/research.html", "research.html", "research-ja.html"),
        ("/research-ja.html", "research-ja.html", "research.html"),
    ]
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '    xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    for loc, en_href, ja_href in pages:
        full = BASE + (loc if loc != "/" else "/")
        en_url = BASE + ("/" if en_href == "index.html" else f"/{en_href}")
        ja_url = BASE + f"/{ja_href}"
        lines.extend([
            "    <url>",
            f"        <loc>{full}</loc>",
            f"        <lastmod>{today}</lastmod>",
            f'        <xhtml:link rel="alternate" hreflang="en" href="{en_url}" />',
            f'        <xhtml:link rel="alternate" hreflang="ja" href="{ja_url}" />',
            f'        <xhtml:link rel="alternate" hreflang="x-default" href="{en_url}" />',
            "    </url>",
        ])
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    for src, dst in COPY:
        raw = (PREVIEW / src).read_text(encoding="utf-8")
        out = strip_preview(raw)
        if dst.endswith(".html"):
            out = inject_seo(out, dst)
        (ROOT / dst).write_text(out, encoding="utf-8")
        print(f"wrote {dst}")

    for old, target in REDIRECTS.items():
        lang = "ja" if old == "cv.html" else "en"
        (ROOT / old).write_text(redirect_html(target, lang), encoding="utf-8")
        print(f"redirect {old} -> {target}")

    write_sitemap()
    print("updated sitemap.xml")


if __name__ == "__main__":
    main()
