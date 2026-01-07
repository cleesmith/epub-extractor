# EPUB Extractor

A simple local tool to unzip and inspect EPUB files.

Extracts `some_ebook.epub` to `~/Documents/some_ebook/` and lets you browse/view the extracted files in your browser.

## Features

- File picker to select `.epub` files
- Extracts to `~/Documents/` with clickable file list
- View xhtml, css, xml, images, etc. in browser
- Displays OPF metadata (title, creator, publisher, generator, etc.)
- Internal links work for navigation within xhtml files

## Usage

```bash
npm install
npm run build
npm start
```

Then open http://localhost:3000

## Note

This is a **local-only** tool - it writes to your filesystem. It won't work on serverless platforms like Vercel.

## License

MIT
