# EPUB Extractor

A local tool to unzip and inspect EPUB files.

Extracts `some_ebook.epub` to `~/Documents/some_ebook/` and lets you browse/view the extracted files in your browser.

## Features

- File picker to select `.epub` files
- Extracts to `~/Documents/` with clickable file list
- View xhtml, css, xml, images, etc. in browser
- Displays OPF metadata (title, creator, publisher, generator, etc.)
- Internal links work for navigation within xhtml files

## Built With

- **Next.js 15** (React framework)
- **React 19**
- **JSZip** (for extracting epub)

---

## Requirements

To use `npm` you need **Node.js** installed (npm comes bundled with it).

Download from: https://nodejs.org (LTS version recommended)

## Install & Run

1. Download the ZIP from GitHub (green "Code" button → "Download ZIP")
2. Unzip to a folder
3. Open Terminal/Command Prompt in that folder
4. Run:

```bash
npm install
npm run build
npm start
```

5. Open http://localhost:3000 in your browser

## Note

This is a **local-only** tool - it writes to your filesystem (`~/Documents/`). It won't work on serverless platforms like Vercel.

---
