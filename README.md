# Panchanga PDF Archive

This repository is an archive of Nepali Panchanga PDFs (archived and scanned, preserved for viewing).

## Browse with GitHub Pages (recommended)

This repo includes a modern, client-side homepage that lets you browse PDFs with **search**, **year filter**, and a **list/grid** view, showing basic metadata like **file size** and **last modified date**.

- Homepage: `index.html` (served by GitHub Pages)
- All-PDF index: [`PDFs/index.md`](./PDFs/index.md)

### Enable GitHub Pages

In your GitHub repo settings:
1. Go to **Settings** -> **Pages**
2. Set **Source** to **Deploy from a branch**
3. Select the branch `main` and folder `/ (root)`

After that, the page should appear at your GitHub Pages URL (typically):
`https://<username>.github.io/<repo>/`

## How the page gets its data

The homepage reads `pdfs.json` (generated from the real files in `PDFs/`).

- To refresh the index after adding/removing PDFs:
  `node scripts/generate-pdfs-json.mjs`

## Contributing

If you add new scanned PDFs into `PDFs/`, re-run the generator so the homepage index stays up to date.

